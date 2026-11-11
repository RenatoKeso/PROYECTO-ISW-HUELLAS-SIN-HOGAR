import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";

import { crearAdopcionRouter } from "../../src/routes/adopcionRoutes.js";
import { crearAdopcionController } from "../../src/controllers/adopcionController.js";
import { obtenerCatalogo } from "../../src/services/adopcionService.js";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "../../src/handlers/manejadorErrores.js";

const GRETEL = {
  id: 1,
  codigoAnimal: "anim-001",
  nombre: "Gretel",
  especie: "PERRO",
  sexoAnimal: "HEMBRA",
  raza: "Quiltra",
  edad: 3,
  observaciones: "Sociable con otros perros.",
};

// Levanta un servidor temporal con el router de adopciones y un controlador de prueba.
async function conServidor(controlador, comprobar) {
  const app = express();
  app.use(express.json());
  app.use("/api/adopciones", crearAdopcionRouter({ controlador }));
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");
    const { port } = servidor.address();
    await comprobar(`http://127.0.0.1:${port}/api/adopciones`);
  } finally {
    servidor.close();
  }
}

test("obtenerCatalogo devuelve los animales que entrega el repositorio", async () => {
  const animales = await obtenerCatalogo({
    listarAnimalesDisponibles: async () => [GRETEL],
  });

  assert.deepEqual(animales, [GRETEL]);
});

test("GET /animales responde 200 con la lista de animales en adopcion", async () => {
  const controlador = crearAdopcionController({
    obtenerCatalogoAdopcion: async () => [GRETEL],
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await fetch(`${url}/animales`);
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.deepEqual(cuerpo.animales, [GRETEL]);
  });
});

test("GET /animales responde una lista vacia si no hay animales en adopcion", async () => {
  const controlador = crearAdopcionController({
    obtenerCatalogoAdopcion: async () => [],
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await fetch(`${url}/animales`);
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.deepEqual(cuerpo.animales, []);
  });
});