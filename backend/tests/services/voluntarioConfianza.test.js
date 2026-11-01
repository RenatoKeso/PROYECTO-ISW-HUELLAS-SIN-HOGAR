import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import express from "express";
import { RolUsuario } from "@prisma/client";
import * as backend from "../../src/services/permisosUsuario.js";
import * as frontend from "../../../frontend/src/utils/permisosUsuario.js";
import {
  loginRespuestaSchema,
  sesionRespuestaSchema,
} from "../../../frontend/src/validations/authValidation.js";
import { crearAuthService } from "../../src/services/authService.js";
import { crearRouter } from "../../src/routes/index.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";

const ROL = "VOLUNTARIO_CONFIANZA";

const usuario = {
  id: 2,
  nombre: "Voluntario de prueba",
  email: "confianza@example.com",
  rol: ROL,
  activo: true,
  tokenVersion: 0,
  voluntarioId: 2,
};

test("el nuevo rol existe en Prisma y en las listas de roles", () => {
  assert.equal(
    RolUsuario.VOLUNTARIO_CONFIANZA,
    ROL
  );

  assert.ok(backend.ROLES_USUARIO.includes(ROL));
  assert.ok(frontend.ROLES_USUARIO.includes(ROL));

  assert.equal(
    frontend.NOMBRES_ROL[ROL],
    "Voluntario de confianza"
  );
});

test("conserva permisos de fichas sin recibir permisos de otras áreas", () => {
  const permisos = [
    ["puedeGestionarFichas", true],
    ["puedeConsultarAlertas", false],
    ["puedeConsultarReportesDevolucion", false],
    ["puedeGestionarAdopciones", false],
  ];

  for (const [nombre, esperado] of permisos) {
    assert.equal(
      backend[nombre](usuario),
      esperado
    );

    assert.equal(
      frontend[nombre](usuario),
      esperado
    );

    assert.equal(
      backend[nombre]({
        ...usuario,
        activo: false,
      }),
      false
    );
  }

  assert.equal(
    backend.puedeConsultarVoluntarios(usuario),
    true
  );

  assert.equal(
    backend.puedeCrearUsuario(
      usuario,
      "VOLUNTARIO"
    ),
    false
  );

  assert.equal(
    backend.puedeCrearUsuario(
      {
        id: 1,
        rol: "DIRECTORA",
        activo: true,
      },
      ROL
    ),
    true
  );
});

test("puede iniciar sesión y el frontend acepta su rol", async () => {
  const password = "Una frase de prueba larga";

  const cuenta = {
    ...usuario,
    passwordHash: await bcrypt.hash(password, 4),
  };

  const servicio = crearAuthService({
    secreto: () =>
      "clave-de-pruebas-de-al-menos-32-bytes",

    repo: {
      buscarUsuarioPorEmail: async (email) =>
        email === cuenta.email ? cuenta : null,

      buscarUsuarioPorId: async (id) =>
        id === cuenta.id ? cuenta : null,
    },
  });

  const salida = await servicio.login({
    email: cuenta.email,
    password,
  });

  assert.equal(salida.usuario.rol, ROL);

  assert.equal(
    loginRespuestaSchema.safeParse(salida).success,
    true
  );

  const autenticado = await servicio.autenticar(
    salida.token
  );

  assert.equal(
    sesionRespuestaSchema.safeParse({
      usuario: autenticado,
    }).success,
    true
  );
});

test("las rutas respetan los permisos del nuevo rol", async () => {
  const app = express();
  app.use(express.json());

  app.use(
    "/api",
    crearRouter({
      servicioAuth: {
        async autenticar(token) {
          if (token !== "confianza") {
            throw new AuthError("Sesión inválida");
          }

          return usuario;
        },
      },
    })
  );

  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");

    const base =
      `http://127.0.0.1:${servidor.address().port}/api`;

    const casos = [
      ["POST", "/fichas", 400],
      ["PATCH", "/fichas/1", 400],
      ["POST", "/animales/ingresos", 400],
      [
        "GET",
        "/salud/alertas?diasAnticipacion=7",
        403,
      ],
      ["GET", "/reportes/devoluciones", 403],
      ["GET", "/adopciones/postulaciones", 403],
    ];

    for (const [method, ruta, esperado] of casos) {
      const respuesta = await fetch(base + ruta, {
        method,
        headers: {
          Authorization: "Bearer confianza",
          "Content-Type": "application/json",
          Connection: "close",
        },
        ...(method === "GET"
          ? {}
          : { body: "{}" }),
      });

      assert.equal(
        respuesta.status,
        esperado,
        `${method} ${ruta}`
      );
    }
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) =>
        error ? reject(error) : resolve()
      );
    });
  }
});