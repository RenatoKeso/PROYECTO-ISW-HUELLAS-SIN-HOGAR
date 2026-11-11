import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";
import saludRoutes from "../../src/routes/salud.routes.js";
import {manejadorErrores,manejarRutaNoEncontrada,} from "../../src/handlers/manejadorErrores.js";

const tipos = [
  "vacuna",
  "tratamiento",
  "control",
  "desparasitacion",
  "esterilizacion",
];

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

async function solicitar(datos, ruta = "/alertas/preview") {
  const app = express();

  app.use(express.json());
  app.use("/api/salud", saludRoutes);
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");

    const url =
      `http://127.0.0.1:${servidor.address().port}` +
      `/api/salud${ruta}`;

    const respuesta = await fetch(url, {
      method: datos === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        Connection: "close",
      },
      ...(datos === undefined
        ? {}
        : { body: JSON.stringify(datos) }),
    });

    return {
      estado: respuesta.status,
      datos: await respuesta.json(),
    };
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("POST clasifica, ordena e incluye el limite", async () => {
  const respuesta = await solicitar(consulta);

  assert.equal(respuesta.estado, 200);

  assert.deepEqual(
    respuesta.datos.alertas.map(
      ({ animalId, estado, diasRestantes }) => ({
        animalId,
        estado,
        diasRestantes,
      })
    ),
    [
      {
        animalId: 1,
        estado: "vencido",
        diasRestantes: -3,
      },
      {
        animalId: 2,
        estado: "proximo",
        diasRestantes: 0,
      },
      {
        animalId: 3,
        estado: "proximo",
        diasRestantes: 7,
      },
    ]
  );
});

const invalidos = [
  [
    "sin anticipacion",
    { eventos: [] },
    "diasAnticipacion",
  ],
  [
    "anticipacion negativa",
    { ...consulta, diasAnticipacion: -1 },
    "diasAnticipacion",
  ],
  [
    "identificador cero",
    {
      ...consulta,
      eventos: [
        {
          ...consulta.eventos[0],
          animalId: 0,
        },
      ],
    },
    "eventos.0.animalId",
  ],
  [
    "fecha imposible",
    {
      ...consulta,
      fechaReferencia: "2026-02-30",
    },
    "fechaReferencia",
  ],
];

for (const [nombre, datos, campo] of invalidos) {
  test(`POST rechaza ${nombre}`, async () => {
    const respuesta = await solicitar(datos);

    assert.equal(respuesta.estado, 400);
    assert.equal(
      respuesta.datos.code,
      "DATOS_INVALIDOS"
    );

    assert.ok(
      respuesta.datos.detalles.some(
        (detalle) => detalle.campo === campo
      )
    );
  });
}

test("POST devuelve lista vacia fuera del limite", async () => {
  const respuesta = await solicitar({
    ...consulta,
    eventos: [consulta.eventos[3]],
  });

  assert.equal(respuesta.estado, 200);
  assert.deepEqual(respuesta.datos.alertas, []);
});

test("POST permite omitir la fecha de referencia", async () => {
  const respuesta = await solicitar({
    diasAnticipacion: 0,
    eventos: [],
  });

  assert.equal(respuesta.estado, 200);

  assert.match(
    respuesta.datos.fechaReferencia,
    /^\d{4}-\d{2}-\d{2}$/
  );
});

test("POST admite los cinco tipos del requisito", async () => {
  const respuesta = await solicitar({
    ...consulta,
    eventos: tipos.map((tipo, indice) => ({
      animalId: indice + 1,
      tipo,
      fechaProgramada: consulta.fechaReferencia,
    })),
  });

  assert.equal(respuesta.estado, 200);

  assert.deepEqual(
    respuesta.datos.alertas.map((alerta) => alerta.tipo),
    tipos
  );
});

test("GET devuelve los cinco tipos del requisito", async () => {
  const respuesta = await solicitar(undefined, "/tipos");

  assert.equal(respuesta.estado, 200);

  assert.deepEqual(
    [...respuesta.datos.tipos].sort(),
    [...tipos].sort()
  );
});