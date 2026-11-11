import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { crearAuthService } from "../../src/services/authService.js";
import { primeraDirectoraSchema } from "../../src/validations/authValidation.js";

const clave = "clave-aleatoria-para-pruebas-de-al-menos-32-bytes";
const password = "Una frase de prueba larga";
const hash = await bcrypt.hash(password, 4);

function preparar() {
    const usuario = {
    id: 1,
    nombre: "Directora",
    email: "directora@example.com",
    passwordHash: hash,
    rol: "DIRECTORA",
    activo: true,
    tokenVersion: 0,
    voluntarioId: null,
};

    const repo = {
    async buscarUsuarioPorEmail(email) {
        return email === usuario.email ? usuario : null;
    },

    async buscarUsuarioPorId(id) {
        return id === usuario.id ? usuario : null;
    },

    async invalidarSesiones() {
        usuario.tokenVersion += 1;
    },
};

    return {
    usuario,
    servicio: crearAuthService({
        repo,
        secreto: () => clave,
        }),
    };
}

test("login normaliza correo, devuelve token y no expone hash", async () => {
    const { servicio } = preparar();

    const salida = await servicio.login({
    email: " DIRECTORA@example.com ",
    password,
});

    assert.equal(salida.usuario.rol, "DIRECTORA");
    assert.equal("passwordHash" in salida.usuario, false);
    assert.equal((await servicio.autenticar(salida.token)).id, 1);
});

test("rechaza contraseña incorrecta y cuenta inactiva", async () => {
    const { usuario, servicio } = preparar();

    await assert.rejects(
    servicio.login({
        email: usuario.email,
        password: "incorrecta",
    }),
    { codigo: "CREDENCIALES_INVALIDAS", estadoHttp: 401 }
);

    usuario.activo = false;

await assert.rejects(
    servicio.login({ email: usuario.email, password }),
    { codigo: "CREDENCIALES_INVALIDAS", estadoHttp: 401 }
    );
});

test("desactivar cuenta invalida un token anterior", async () => {
    const { usuario, servicio } = preparar();

    const { token } = await servicio.login({
    email: usuario.email,
    password,
});

    usuario.activo = false;

    await assert.rejects(
    servicio.autenticar(token),
    { estadoHttp: 401 }
    );
});

test("logout invalida tokens y se consulta el rol actual", async () => {
    const { usuario, servicio } = preparar();

    const { token } = await servicio.login({
    email: usuario.email,
    password,
});

    usuario.rol = "VETERINARIA";

    assert.equal(
    (await servicio.autenticar(token)).rol,
    "VETERINARIA"
);

    await servicio.logout(usuario.id);

    await assert.rejects(
    servicio.autenticar(token),
    { estadoHttp: 401 }
    );
});

test("rechaza tokens vencidos, firma incorrecta y otro algoritmo", async () => {
    const { servicio } = preparar();

    const opciones = {
    issuer: "huellas-backend",
    audience: "huellas-frontend",
    subject: "1",
};

    const tokens = [
    jwt.sign(
        { version: 0 },
        clave,
        { ...opciones, expiresIn: -1 }
    ),
    jwt.sign(
        { version: 0 },
        "otra-clave",
        { ...opciones, expiresIn: "15m" }
    ),
    jwt.sign(
        { version: 0 },
        clave,
        { ...opciones, algorithm: "HS384", expiresIn: "15m" }
        ),
    ];

    for (const token of tokens) {
    await assert.rejects(
        servicio.autenticar(token),
        { estadoHttp: 401 }
        );
    }
});

test("rechaza rol enviado en login y contraseñas que bcrypt truncaría", async () => {
    const { usuario, servicio } = preparar();

    await assert.rejects(
    servicio.login({
        email: usuario.email,
        password,
        rol: "DIRECTORA",
    })
);

    const resultado = primeraDirectoraSchema.safeParse({
    nombre: "Directora",
    email: usuario.email,
    password: "ñ".repeat(40),
});

    assert.equal(resultado.success, false);
});