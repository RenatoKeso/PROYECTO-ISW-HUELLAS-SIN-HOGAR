import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { crearAuthRouter } from "../../src/routes/authRoutes.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { AuthError } from "../../src/entities/authErrors.js";

test("rutas de sesión comprueban token y limitan intentos", async () => {
    const usuario = {
    id: 1,
    nombre: "Directora",
    email: "d@example.com",
    rol: "DIRECTORA",
    voluntarioId: null,
};

    let cierres = 0;

    const app = express();
    app.use(express.json());

    app.use(
    "/auth",
    crearAuthRouter({
        async login() {
        throw new AuthError("Credenciales incorrectas");
    },

        async autenticar(token) {
        if (token !== "valido") {
            throw new AuthError("Sesión inválida");
        }

        return usuario;
    },

        async logout() {
        cierres += 1;
        },
    })
);

    app.use(manejadorErrores);

    const servidor = app.listen(0, "127.0.0.1");
    await once(servidor, "listening");

    const url = `http://127.0.0.1:${servidor.address().port}/auth`;

try {
    assert.equal((await fetch(`${url}/me`)).status, 401);

    const headers = {
        Authorization: "Bearer valido",
    };

    const respuesta = await fetch(`${url}/me`, { headers });

    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).usuario.id, 1);

    const cierre = await fetch(`${url}/logout`, {
        method: "POST",
        headers,
    });

    assert.equal(cierre.status, 200);
    assert.equal(cierres, 1);

    for (let i = 0; i < 20; i++) {
        const intento = await fetch(`${url}/login`, {
        method: "POST",
    });

        assert.equal(intento.status, 401);
    }

    const limitado = await fetch(`${url}/login`, {
        method: "POST",
    });

    assert.equal(limitado.status, 429);
    }finally {
    await new Promise((resolve, reject) => {
        servidor.close((error) => {
        if (error) reject(error);
        else resolve();
            });
        });
    }
});