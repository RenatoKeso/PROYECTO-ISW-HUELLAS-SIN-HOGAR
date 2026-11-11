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
  const llamadas = { inscribir: [] };

  const controlador = crearInscripcionController({
    inscribirse:
      inscribirse ??
      (async (datos, usuario) => {
        llamadas.inscribir.push({ datos, usuario });
        return { id: 1, turnoId: datos.turnoId, estado: "ACTIVA" };
      }),
  });

  return { controlador, llamadas };
}

test("inscribirse exige sesion", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(url, { metodo: "POST", cuerpo: { turnoId: 1 } });

    assert.equal(respuesta.status, 401);
  });

  assert.equal(llamadas.inscribir.length, 0);
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
