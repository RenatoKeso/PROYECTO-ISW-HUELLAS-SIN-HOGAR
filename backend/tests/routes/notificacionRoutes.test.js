import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { crearNotificacionController } from "../../src/controllers/notificacionController.js";
import { crearNotificacionRouter } from "../../src/routes/notificacionRoutes.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { notificacionInexistente } from "../../src/entities/notificacionErrors.js";

const voluntaria = {
  id: 3,
  nombre: "Voluntaria",
  rol: "VOLUNTARIO",
  activo: true,
};

function autenticarFalso(request, response, next) {
  const cabecera = request.get("Authorization") ?? "";
  const coincidencia = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(cabecera);

  if (!coincidencia || coincidencia[1] !== "valido") {
    return next(new AuthError("Debes iniciar sesión"));
  }

  request.usuario = voluntaria;
  next();
}

async function levantarApp({
  listar = async () => [],
  marcarLeida = async () => ({ id: 1, leida: true }),
} = {}) {
  const app = express();
  app.use(express.json());

  const controlador = crearNotificacionController({ listar, marcarLeida });

  app.use(
    "/notificaciones",
    crearNotificacionRouter({ controlador, autenticar: autenticarFalso }),
  );

  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");

  return {
    url: `http://127.0.0.1:${servidor.address().port}/notificaciones`,
    cerrar: () =>
      new Promise((resolve, reject) => {
        servidor.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("listar notificaciones exige un token valido", async () => {
  const { url, cerrar } = await levantarApp();

  try {
    const respuesta = await fetch(url);

    assert.equal(respuesta.status, 401);
    assert.equal((await respuesta.json()).code, "SESION_INVALIDA");
  } finally {
    await cerrar();
  }
});

test("lista las notificaciones del actor autenticado", async () => {
  let recibido = null;
  const notificaciones = [
    { id: 1, titulo: "Revisión actualizada", leida: false },
  ];

  const { url, cerrar } = await levantarApp({
    listar: async (datos) => {
      recibido = datos;
      return notificaciones;
    },
  });

  try {
    const respuesta = await fetch(url, {
      headers: { Authorization: "Bearer valido" },
    });

    assert.equal(respuesta.status, 200);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.message, "Notificaciones obtenidas correctamente");
    assert.deepEqual(cuerpo.notificaciones, notificaciones);
    assert.deepEqual(recibido, { actor: voluntaria });
  } finally {
    await cerrar();
  }
});

test("marcar como leida exige un identificador valido", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp({
    marcarLeida: async () => {
      llamadas += 1;
    },
  });

  try {
    const respuesta = await fetch(`${url}/abc/leida`, {
      method: "PATCH",
      headers: { Authorization: "Bearer valido" },
    });

    assert.equal(respuesta.status, 400);
    assert.equal((await respuesta.json()).code, "DATOS_INVALIDOS");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("marcar una notificacion inexistente responde 404", async () => {
  const { url, cerrar } = await levantarApp({
    marcarLeida: async () => {
      throw notificacionInexistente(99);
    },
  });

  try {
    const respuesta = await fetch(`${url}/99/leida`, {
      method: "PATCH",
      headers: { Authorization: "Bearer valido" },
    });

    assert.equal(respuesta.status, 404);
    assert.equal(
      (await respuesta.json()).code,
      "NOTIFICACION_INEXISTENTE",
    );
  } finally {
    await cerrar();
  }
});

test("marca una notificacion propia como leida", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp({
    marcarLeida: async (datos) => {
      recibido = datos;
      return { id: 4, leida: true };
    },
  });

  try {
    const respuesta = await fetch(`${url}/4/leida`, {
      method: "PATCH",
      headers: { Authorization: "Bearer valido" },
    });

    assert.equal(respuesta.status, 200);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.message, "Notificación marcada como leída");
    assert.deepEqual(cuerpo.notificacion, { id: 4, leida: true });
    assert.deepEqual(recibido, { notificacionId: 4, actor: voluntaria });
  } finally {
    await cerrar();
  }
});
