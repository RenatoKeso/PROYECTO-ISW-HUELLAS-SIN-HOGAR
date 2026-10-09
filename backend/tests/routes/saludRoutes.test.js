import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";

import saludRoutes from "../../src/routes/salud.routes.js";
import {
    manejadorErrores,
    manejarRutaNoEncontrada,
} from "../../src/handlers/manejadorErrores.js";

// Crea un servidor temporal para probar las rutas.
async function conServidor(comprobar) {
const app = express();

    app.use(express.json());
    app.use("/api/salud", saludRoutes);
    app.use(manejarRutaNoEncontrada);
    app.use(manejadorErrores);

const servidor = app.listen(0, "127.0.0.1");

    try {
    await once(servidor, "listening");

    const puerto = servidor.address().port;
    const url = `http://127.0.0.1:${puerto}/api/salud`;

    await comprobar(url);
} finally {
    await new Promise((resolver, rechazar) => {
        servidor.close((error) => {
        if (error) rechazar(error);
        else resolver();
        });
    });
    }
}

// Envía los datos al endpoint de vista previa.
async function consultar(url, datos) {
const respuesta = await fetch(`${url}/alertas/preview`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Connection: "close",
    },
    body: JSON.stringify(datos),
});

return {
    estado: respuesta.status,
    datos: await respuesta.json(),
};
}

const consulta = {
    fechaReferencia: "2026-10-09",
    diasAnticipacion: 7,
    eventos: [
    {
        animalId: 3,
        tipo: "vacuna",
        fechaProgramada: "2026-10-16",
    },
    {
        animalId: 1,
        tipo: "tratamiento",
        fechaProgramada: "2026-10-06",
    },
    {
        animalId: 2,
        tipo: "control",
        fechaProgramada: "2026-10-09",
    },
    {
        animalId: 4,
        tipo: "vacuna",
        fechaProgramada: "2026-10-17",
    },
],
};

// Comprueba el código HTTP y el campo que produjo el error.
function comprobarError(respuesta, campo) {
    assert.equal(respuesta.estado, 400);
    assert.equal(respuesta.datos.code, "DATOS_INVALIDOS");
    assert.equal(typeof respuesta.datos.message, "string");

assert.ok(
    respuesta.datos.detalles.some(
        (detalle) => detalle.campo === campo
    )
    );
}

test("POST devuelve alertas completas y ordenadas", async () => {
await conServidor(async (url) => {
    const respuesta = await consultar(url, consulta);

    assert.equal(respuesta.estado, 200);

    assert.deepEqual(respuesta.datos, {
        fechaReferencia: "2026-10-09",
        diasAnticipacion: 7,
        alertas: [
        {
            animalId: 1,
            tipo: "tratamiento",
            fechaProgramada: "2026-10-06",
            estado: "vencido",
            diasRestantes: -3,
        },
        {
            animalId: 2,
            tipo: "control",
            fechaProgramada: "2026-10-09",
            estado: "proximo",
            diasRestantes: 0,
        },
        {
            animalId: 3,
            tipo: "vacuna",
            fechaProgramada: "2026-10-16",
            estado: "proximo",
            diasRestantes: 7,
        },
        ],
    });
    });
});

test("POST rechaza una consulta sin anticipacion", async () => {
await conServidor(async (url) => {
    const respuesta = await consultar(url, {
        eventos: [],
    });

    comprobarError(respuesta, "diasAnticipacion");
});
});

test("POST rechaza anticipacion negativa", async () => {
    await conServidor(async (url) => {
    const respuesta = await consultar(url, {
        ...consulta,
        diasAnticipacion: -1,
    });

    comprobarError(respuesta, "diasAnticipacion");
    });
});

test("POST rechaza un identificador de animal igual a cero", async () => {
await conServidor(async (url) => {
    const respuesta = await consultar(url, {
        ...consulta,
        eventos: [
        {
            ...consulta.eventos[0],
            animalId: 0,
        },
    ],
    });

    comprobarError(respuesta, "eventos.0.animalId");
});
});

test("POST rechaza una fecha imposible", async () => {
await conServidor(async (url) => {
    const respuesta = await consultar(url, {
        ...consulta,
        fechaReferencia: "2026-02-30",
    });

    comprobarError(respuesta, "fechaReferencia");
});
});

test("POST devuelve lista vacia para eventos fuera del limite", async () => {
await conServidor(async (url) => {
    const respuesta = await consultar(url, {
        ...consulta,
        eventos: [consulta.eventos[3]],
    });

    assert.equal(respuesta.estado, 200);
    assert.deepEqual(respuesta.datos.alertas, []);
  });
});

test("POST permite omitir la fecha de referencia", async () => {
  await conServidor(async (url) => {
    const respuesta = await consultar(url, {
      diasAnticipacion: 0,
      eventos: [],
    });

    assert.equal(respuesta.estado, 200);

    assert.match(
      respuesta.datos.fechaReferencia,
      /^\d{4}-\d{2}-\d{2}$/
    );

    assert.deepEqual(respuesta.datos.alertas, []);
  });
});

test("GET devuelve los tres tipos de atencion", async () => {
  await conServidor(async (url) => {
    const respuesta = await fetch(`${url}/tipos`, {
      headers: {
        Connection: "close",
      },
    });

    assert.equal(respuesta.status, 200);

    const datos = await respuesta.json();

    assert.deepEqual(
      datos.tipos.sort(),
      ["control", "tratamiento", "vacuna"]
    );
  });
});