import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { crearAnimalRouter } from "../../src/routes/animalRoutes.js";
import { crearAnimalController } from "../../src/controllers/animalController.js";
import { fichaInexistentePorId } from "../../src/entities/animalErrors.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";

const ingresoInicialValido = {
  nombre: "Nube",
  sexoAnimal: "HEMBRA",
  especie: "GATO",
  receptorId: 6,
  fechaIngreso: "2026-09-29T10:00:00-03:00",
  procedencia: "Hallazgo en via publica",
};

async function levantarApp(controladores = {}) {
  const app = express();
  app.use(express.json());

  app.use(
    "/api",
    crearAnimalRouter({
      controlador: crearAnimalController(controladores),
    }),
  );

  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");

  return {
    url: `http://127.0.0.1:${servidor.address().port}/api`,
    cerrar: () =>
      new Promise((resolve, reject) => {
        servidor.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("GET /animales/:id/ingresos devuelve la ficha y el historial publico", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp({
    listarIngresosAnimal: async (fichaId) => {
      recibido = fichaId;

      return {
        ficha: {
          id: 10,
          codigoAnimal: "anim-010",
          nombre: "Firulais",
          estadoEstadia: "ACTIVO",
        },
        ingresos: [
          {
            id: 3,
            fichaAnimalId: 10,
            fechaIngreso: new Date("2026-11-03T10:00:00.000Z"),
            procedencia: "Hallazgo en via publica",
            ubicacionEncontrado: "Av. Central",
            estadoSalud: "En observacion",
            receptor: { id: 2, nombre: "Ana" },
          },
        ],
      };
    },
  });

  try {
    const respuesta = await fetch(`${url}/animales/10/ingresos`);
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(recibido, 10);
    assert.equal(cuerpo.message, "Historial de ingresos obtenido correctamente");
    assert.deepEqual(cuerpo.ficha, {
      id: 10,
      codigoAnimal: "anim-010",
      nombre: "Firulais",
    });
    assert.deepEqual(cuerpo.ingresos, [
      {
        id: 3,
        fechaIngreso: "2026-11-03T10:00:00.000Z",
        procedencia: "Hallazgo en via publica",
        ubicacionEncontrado: "Av. Central",
        estadoSalud: "En observacion",
        receptor: { id: 2, nombre: "Ana" },
      },
    ]);
  } finally {
    await cerrar();
  }
});

test("GET /animales/abc/ingresos responde 400 sin consultar el historial", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp({
    listarIngresosAnimal: async () => {
      llamadas += 1;
    },
  });

  try {
    const respuesta = await fetch(`${url}/animales/abc/ingresos`);

    assert.equal(respuesta.status, 400);
    assert.equal((await respuesta.json()).code, "DATOS_INVALIDOS");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("GET /animales/:id/ingresos responde 404 si la ficha no existe", async () => {
  const { url, cerrar } = await levantarApp({
    listarIngresosAnimal: async (fichaId) => {
      throw fichaInexistentePorId(fichaId);
    },
  });

  try {
    const respuesta = await fetch(`${url}/animales/99/ingresos`);
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 404);
    assert.equal(cuerpo.code, "FICHA_INEXISTENTE");
  } finally {
    await cerrar();
  }
});

test("el ingreso inicial devuelve el registro medico creado", async () => {
  const { url, cerrar } = await levantarApp({
    registrarIngresoAnimal: async () => ({
      ficha: { id: 12, codigoAnimal: "anim-012" },
      reingreso: false,
      registroMedico: {
        id: 500,
        estadoValidacion: "PROVISIONAL",
        createdAt: new Date("2026-11-03T10:00:00.000Z"),
      },
    }),
  });

  try {
    const respuesta = await fetch(`${url}/animales/ingresos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ingresoInicialValido),
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.equal(cuerpo.codigoAnimal, "anim-012");
    assert.equal(cuerpo.reingreso, false);
    assert.deepEqual(cuerpo.registroMedico, {
      id: 500,
      estadoValidacion: "PROVISIONAL",
      createdAt: "2026-11-03T10:00:00.000Z",
    });
  } finally {
    await cerrar();
  }
});

test("el reingreso no devuelve registro medico", async () => {
  const { url, cerrar } = await levantarApp({
    registrarIngresoAnimal: async () => ({
      ficha: { id: 1, codigoAnimal: "anim-001" },
      reingreso: true,
    }),
  });

  try {
    const respuesta = await fetch(`${url}/animales/ingresos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigoAnimal: "anim-001",
        receptorId: 7,
        fechaIngreso: "2026-09-29T15:00:00-03:00",
        procedencia: "Devuelto por la familia Vega",
      }),
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.reingreso, true);
    assert.equal(Object.hasOwn(cuerpo, "registroMedico"), false);
  } finally {
    await cerrar();
  }
});
