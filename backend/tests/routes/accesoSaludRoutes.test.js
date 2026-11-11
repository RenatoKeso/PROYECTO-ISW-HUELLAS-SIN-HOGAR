import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";
import { crearRouter } from "../../src/routes/index.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { obtenerAlertasPlan } from "../../src/services/alertasPlan.service.js";
import { ROLES_USUARIO } from "../../src/services/permisosUsuario.js";

const rutasSanitarias = [
{
    metodo: "GET",
    ruta: "/tipos",
    },
    {
    metodo: "GET",
    ruta:
        "/alertas?diasAnticipacion=7" +
        "&fechaReferencia=2026-10-29",
    },
    {
    metodo: "POST",
    ruta: "/alertas/preview",
    cuerpo: {
        diasAnticipacion: 7,
        fechaReferencia: "2026-10-29",
        eventos: [],
        },
    },
];

async function conServidor(comprobar) {
    let consultas = 0;

  // Simulacion solo para estas pruebas, no es un servicio real
const servicioAuth = {
    async autenticar(token) {
        if (!ROLES_USUARIO.includes(token)) {
        throw new AuthError("Sesión inválida");
    }

        return {
        id: 1,
        nombre: "Usuario de prueba",
        email: "prueba@example.com",
        rol: token,
        activo: true,
        voluntarioId: null,
        };
    },
};

    const app = express();
    app.use(express.json());

    app.use(
    "/api",
    crearRouter({
        servicioAuth,consultarAlertas: (filtros) =>
        obtenerAlertasPlan(filtros, {
            buscar: async () => {
            consultas += 1;
            return [];
        },
    }),
})
);

    app.use(manejadorErrores);

    const servidor = app.listen(0, "127.0.0.1");

    try {
    await once(servidor, "listening");

    const puerto = servidor.address().port;
    const base =
        `http://127.0.0.1:${puerto}/api/salud`;

    async function solicitar(configuracion, token) {
        const headers = {
        "Content-Type": "application/json",
        Connection: "close",
    };

        if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

        const opciones = {
        method: configuracion.metodo,
        headers,
    };

        if (configuracion.cuerpo !== undefined) {
        opciones.body = JSON.stringify(
            configuracion.cuerpo
        );
    }

    const respuesta = await fetch(
        `${base}${configuracion.ruta}`,
        opciones
    );

        return {
        estado: respuesta.status,
        datos: await respuesta.json(),
    };
    }

    await comprobar({
        solicitar,
        contarConsultas: () => consultas,
    });
} finally {
    await new Promise((resolve, reject) => {
        servidor.close((error) => {
        if (error) reject(error);
        else resolve();
        });
        });
    }
}

test("salud rechaza solicitudes sin sesión o con token inválido", async () => {
    await conServidor(
    async ({ solicitar, contarConsultas }) => {
        for (const ruta of rutasSanitarias) {
        const respuesta = await solicitar(ruta);
        assert.equal(respuesta.estado, 401);
    }

        const invalida = await solicitar(
        rutasSanitarias[1],
        "token-invalido"
    );

        assert.equal(invalida.estado, 401);
        assert.equal(contarConsultas(), 0);
        }
    );
});

test("los roles sin permiso no acceden al módulo sanitario", async () => {
    await conServidor(
    async ({ solicitar, contarConsultas }) => {
        const rolesSinPermiso = ROLES_USUARIO.filter(
        (rol) =>
            !["DIRECTORA", "VETERINARIA"].includes(rol)
    );

        for (const rol of rolesSinPermiso) {
        for (const ruta of rutasSanitarias) {
            const respuesta = await solicitar(
            ruta,
            rol
            );

            assert.equal(respuesta.estado, 403);

            assert.equal(
            respuesta.datos.code,
            "ACCESO_DENEGADO"
        );
    }
}

        assert.equal(contarConsultas(), 0);
    }
);
});

test("directora y veterinaria pueden consultar las alertas del plan", async () => {
    await conServidor(
    async ({ solicitar, contarConsultas }) => {
        for (const rol of [
        "DIRECTORA",
        "VETERINARIA",
        ]) {
        const respuesta = await solicitar(
            rutasSanitarias[1],
            rol
        );

        assert.equal(respuesta.estado, 200);

        assert.deepEqual(respuesta.datos, {
            fechaReferencia: "2026-10-29",
            diasAnticipacion: 7,
            alertas: [],
        });
    }
    assert.equal(contarConsultas(), 2);
        }
    );
});