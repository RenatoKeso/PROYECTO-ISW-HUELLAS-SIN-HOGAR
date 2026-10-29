import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { crearRouter } from "../../src/routes/index.js";
import { AuthError } from "../../src/entities/authErrors.js";
import {manejadorErrores,manejarRutaNoEncontrada,} from "../../src/handlers/manejadorErrores.js";

const matriz = {
    DIRECTORA: ["fichas", "alertas", "reportes", "voluntarios"],
    ENCARGADA_VOLUNTARIADO: ["fichas", "voluntarios"],
    ENCARGADA_ADOPCIONES: ["reportes", "voluntarios"],
    VETERINARIA: ["alertas"],
    VOLUNTARIO: ["fichas", "voluntarios"],
};

const rutas = [
    ["POST", "/fichas", "fichas", 400],
    ["PATCH", "/fichas/1", "fichas", 400],
    ["POST", "/animales/ingresos", "fichas", 400],
    ["GET", "/voluntarios", "voluntarios", null],
    ["GET", "/reportes/devoluciones", "reportes", null],
    ["POST", "/reportes/devoluciones", "reportes", 400],
    ["GET", "/salud/tipos", "alertas", 200],
    ["GET", "/salud/alertas?diasAnticipacion=7", "alertas", 200],
    ["POST", "/salud/alertas/preview", "alertas", 400],
];

async function conServidor(comprobar) {
    let consultas = 0;

  // Servicio simulado únicamente para estas pruebas.
const servicioAuth = {
    async autenticar(token) {
        if (!Object.hasOwn(matriz, token)) {
        throw new AuthError("Sesión inválida");
    }

        return {
        id: 1,
        rol: token,
        activo: true,
        };
    },
};

    const app = express();
    app.use(express.json());

app.use(
    "/api",
    crearRouter({
        servicioAuth,
        consultarAlertas: async () => {
        consultas += 1;

        return {
            fechaReferencia: "2026-10-29",
            diasAnticipacion: 7,
            alertas: [],
        };
        },
    })
);

    app.use(manejarRutaNoEncontrada);
    app.use(manejadorErrores);

    const servidor = app.listen(0, "127.0.0.1");

try {
    await once(servidor, "listening");

    const base =
        `http://127.0.0.1:${servidor.address().port}/api`;

    async function solicitar([method, ruta], token) {
        const headers = {
        "Content-Type": "application/json",
        Connection: "close",
    };

        if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

        const respuesta = await fetch(base + ruta, {
        method,
        headers,
        ...(method === "GET" ? {} : { body: "{}" }),
    });

        return {
        estado: respuesta.status,
        datos: await respuesta.json(),
    };
}

    await comprobar(solicitar, () => consultas);
    } finally {
    await new Promise((resolve, reject) => {
        servidor.close((error) =>
        error ? reject(error) : resolve()
        );
    });
}
}

test("las rutas internas rechazan solicitudes sin sesión", async () => {
    await conServidor(async (solicitar, contarConsultas) => {
    for (const ruta of rutas) {
        assert.equal(
        (await solicitar(ruta)).estado,
        401,
        ruta[1]
    );
}

    const invalida = await solicitar(
        rutas[7],
        "token-invalido"
    );

    assert.equal(invalida.estado, 401);
    assert.equal(contarConsultas(), 0);
    });
});

test("cada rol accede únicamente a sus módulos", async () => {
    await conServidor(async (solicitar, contarConsultas) => {
    for (const [rol, permisos] of Object.entries(matriz)) {
        for (const ruta of rutas) {
        const permitido = permisos.includes(ruta[2]);

        // Las lecturas permitidas de reportes y voluntarios
        // requieren una base de datos. Aquí se comprueban
        // sus denegaciones de acceso.
        if (permitido && ruta[3] === null) continue;

        const antes = contarConsultas();
        const respuesta = await solicitar(ruta, rol);

        assert.equal(
          respuesta.estado,
          permitido ? ruta[3] : 403,
          `${rol} ${ruta[0]} ${ruta[1]}`
        );

        if (!permitido) {
          assert.equal(
            respuesta.datos.code,
            "ACCESO_DENEGADO"
          );

          assert.equal(contarConsultas(), antes);
        }
      }
    }

    assert.equal(contarConsultas(), 2);
  });
});