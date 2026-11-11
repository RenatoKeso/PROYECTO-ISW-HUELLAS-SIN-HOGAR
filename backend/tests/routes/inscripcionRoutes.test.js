import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";

import { crearInscripcionRouter } from "../../src/routes/inscripcionRoutes.js";
import { crearInscripcionController } from "../../src/controllers/inscripcionController.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { turnoSinCupos } from "../../src/entities/turnoErrors.js";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "../../src/handlers/manejadorErrores.js";

const ROLES_QUE_SE_INSCRIBEN = ["VOLUNTARIO", "VOLUNTARIO_CONFIANZA"];
const ROLES_SIN_ACCESO = ["DIRECTORA", "ENCARGADA_VOLUNTARIADO", "ENCARGADA_ADOPCIONES", "VETERINARIA"];

// Autenticacion de prueba: el rol llega en el encabezado x-rol.
function autenticarDePrueba(request, response, next) {
  const rol = request.get("x-rol");

  if (!rol) {
    next(new AuthError("Debes iniciar sesión"));
    return;
  }

  request.usuario = { id: 5, rol, activo: true, voluntarioId: 2 };
  next();
}

async function conServidor(controlador, comprobar) {
  const app = express();
  app.use(express.json());
  app.use("/api/inscripciones", crearInscripcionRouter({ controlador, autenticar: autenticarDePrueba }));
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");
    const { port } = servidor.address();
    await comprobar(`http://127.0.0.1:${port}/api/inscripciones`);
  } finally {
    servidor.close();
  }
}

function pedir(url, { metodo = "GET", rol, cuerpo } = {}) {
  return fetch(url, {
    method: metodo,
    headers: {
      ...(rol ? { "x-rol": rol } : {}),
      ...(cuerpo ? { "Content-Type": "application/json" } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
}

function controladorDePrueba(inscribirse) {
  const llamadas = { inscribir: [], mias: [], historial: [], cancelar: [], modificar: [] };

  const controlador = crearInscripcionController({
    inscribirse:
      inscribirse ??
      (async (datos, usuario) => {
        llamadas.inscribir.push({ datos, usuario });
        return { id: 1, turnoId: datos.turnoId, estado: "ACTIVA" };
      }),
    obtenerMias: async (filtro, usuario) => {
      llamadas.mias.push({ filtro, usuario });
      return [{ id: 1 }];
    },
    obtenerHistorial: async (id, usuario) => {
      llamadas.historial.push({ id, usuario });
      return { inscripcion: { id }, historial: [] };
    },
    cancelar: async (id, usuario) => {
      llamadas.cancelar.push({ id, usuario });
      return { id, estado: "CANCELADA" };
    },
    modificar: async (id, datos, usuario) => {
      llamadas.modificar.push({ id, datos, usuario });
      return { id, turnoId: datos.turnoId, estado: "ACTIVA" };
    },
  });

  return { controlador, llamadas };
}

test("las rutas de inscripciones exigen sesion", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    for (const [metodo, ruta, cuerpo] of [
      ["POST", "", { turnoId: 1 }],
      ["GET", "/mias"],
      ["GET", "/3/historial"],
      ["PATCH", "/3/cancelacion"],
      ["PATCH", "/3", { turnoId: 2 }],
    ]) {
      const respuesta = await pedir(`${url}${ruta}`, { metodo, cuerpo });

      assert.equal(respuesta.status, 401, `${metodo} ${ruta}`);
    }
  });

  assert.equal(
    llamadas.inscribir.length +
      llamadas.mias.length +
      llamadas.historial.length +
      llamadas.cancelar.length +
      llamadas.modificar.length,
    0,
  );
});

test("solo los voluntarios se inscriben", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    for (const rol of ROLES_QUE_SE_INSCRIBEN) {
      const respuesta = await pedir(url, { metodo: "POST", rol, cuerpo: { turnoId: 1 } });

      assert.equal(respuesta.status, 201, rol);
    }

    for (const rol of ROLES_SIN_ACCESO) {
      const respuesta = await pedir(url, { metodo: "POST", rol, cuerpo: { turnoId: 1 } });

      assert.equal(respuesta.status, 403, rol);
      assert.equal((await respuesta.json()).code, "ACCESO_DENEGADO");
    }
  });

  assert.equal(llamadas.inscribir.length, ROLES_QUE_SE_INSCRIBEN.length);
});

test("responde 201 con la inscripcion y entrega al servicio el usuario de la sesion", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(url, { metodo: "POST", rol: "VOLUNTARIO", cuerpo: { turnoId: 4 } });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.equal(cuerpo.message, "Inscripción realizada correctamente");
    assert.equal(cuerpo.inscripcion.turnoId, 4);
  });

  assert.deepEqual(llamadas.inscribir[0].datos, { turnoId: 4 });
  assert.equal(llamadas.inscribir[0].usuario.voluntarioId, 2);
});

test("un cuerpo invalido responde 400 y no llega al servicio", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    for (const cuerpo of [{}, { turnoId: "1" }, { turnoId: 1, voluntarioId: 9 }]) {
      const respuesta = await pedir(url, { metodo: "POST", rol: "VOLUNTARIO", cuerpo });

      assert.equal(respuesta.status, 400, JSON.stringify(cuerpo));
    }
  });

  assert.equal(llamadas.inscribir.length, 0);
});

test("un error de regla de negocio se responde con su estado y su codigo", async () => {
  const { controlador } = controladorDePrueba(async () => {
    throw turnoSinCupos();
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(url, { metodo: "POST", rol: "VOLUNTARIO", cuerpo: { turnoId: 1 } });

    assert.equal(respuesta.status, 409);
    assert.equal((await respuesta.json()).code, "TURNO_SIN_CUPOS");
  });
});

test("mis inscripciones pasa el filtro validado y el usuario de la sesion", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const todas = await pedir(`${url}/mias`, { rol: "VOLUNTARIO" });
    const activas = await pedir(`${url}/mias?estado=ACTIVA`, { rol: "VOLUNTARIO_CONFIANZA" });
    const invalida = await pedir(`${url}/mias?estado=OTRA`, { rol: "VOLUNTARIO" });
    const otroRol = await pedir(`${url}/mias`, { rol: "ENCARGADA_VOLUNTARIADO" });

    assert.equal(todas.status, 200);
    assert.deepEqual((await todas.json()).inscripciones, [{ id: 1 }]);
    assert.equal(activas.status, 200);
    assert.equal(invalida.status, 400);
    assert.equal(otroRol.status, 403);
  });

  assert.deepEqual(llamadas.mias.map((llamada) => llamada.filtro), [{}, { estado: "ACTIVA" }]);
  assert.equal(llamadas.mias[0].usuario.voluntarioId, 2);
});

test("el historial recibe el id como numero y rechaza ids invalidos", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const ok = await pedir(`${url}/7/historial`, { rol: "VOLUNTARIO" });
    const invalido = await pedir(`${url}/abc/historial`, { rol: "VOLUNTARIO" });

    assert.equal(ok.status, 200);
    assert.deepEqual((await ok.json()).inscripcion, { id: 7 });
    assert.equal(invalido.status, 400);
  });

  assert.deepEqual(llamadas.historial.map((llamada) => llamada.id), [7]);
});

test("cancelar recibe el id como numero y solo lo usan los voluntarios", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const ok = await pedir(`${url}/7/cancelacion`, { metodo: "PATCH", rol: "VOLUNTARIO" });
    const invalido = await pedir(`${url}/x/cancelacion`, { metodo: "PATCH", rol: "VOLUNTARIO" });
    const otroRol = await pedir(`${url}/7/cancelacion`, { metodo: "PATCH", rol: "DIRECTORA" });

    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).inscripcion.estado, "CANCELADA");
    assert.equal(invalido.status, 400);
    assert.equal(otroRol.status, 403);
  });

  assert.deepEqual(llamadas.cancelar.map((llamada) => llamada.id), [7]);
  assert.equal(llamadas.cancelar[0].usuario.id, 5);
});

test("modificar valida el id y el cuerpo, y solo lo usan los voluntarios", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const ok = await pedir(`${url}/7`, { metodo: "PATCH", rol: "VOLUNTARIO", cuerpo: { turnoId: 2 } });
    const sinCuerpo = await pedir(`${url}/7`, { metodo: "PATCH", rol: "VOLUNTARIO", cuerpo: {} });
    const idInvalido = await pedir(`${url}/x`, { metodo: "PATCH", rol: "VOLUNTARIO", cuerpo: { turnoId: 2 } });
    const otroRol = await pedir(`${url}/7`, { metodo: "PATCH", rol: "DIRECTORA", cuerpo: { turnoId: 2 } });

    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).inscripcion.turnoId, 2);
    assert.equal(sinCuerpo.status, 400);
    assert.equal(idInvalido.status, 400);
    assert.equal(otroRol.status, 403);
  });

  assert.deepEqual(llamadas.modificar.map((llamada) => [llamada.id, llamada.datos]), [[7, { turnoId: 2 }]]);
});

