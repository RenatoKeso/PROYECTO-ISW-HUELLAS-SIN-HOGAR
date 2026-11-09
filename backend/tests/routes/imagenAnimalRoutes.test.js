import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { crearAnimalController } from "../../src/controllers/animalController.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { crearAnimalRouter } from "../../src/routes/animalRoutes.js";

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

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

function formularioFicha(campos = {}, archivo = null) {
  const formData = new FormData();

  formData.append("sexoAnimal", campos.sexoAnimal ?? "MACHO");
  formData.append("especie", campos.especie ?? "PERRO");
  formData.append("edad", campos.edad ?? "4");

  if (campos.nombre) formData.append("nombre", campos.nombre);

  if (archivo) {
    formData.append(
      "imagen",
      new Blob([archivo.contenido], { type: archivo.tipo }),
      archivo.nombre,
    );
  }

  return formData;
}

test("POST /fichas multipart sin archivo crea la ficha con la edad numerica", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp({
    crearFichaAnimal: async (datos, archivo) => {
      recibido = { datos, archivo };
      return {
        id: 9,
        codigoAnimal: "anim-009",
        estadoEstadia: "ACTIVO",
        imagenUrl: null,
        imagenSubidaEn: null,
      };
    },
  });

  try {
    const respuesta = await fetch(`${url}/fichas`, {
      method: "POST",
      body: formularioFicha({ nombre: "Firulais" }),
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.equal(recibido.datos.edad, 4);
    assert.equal(recibido.datos.nombre, "Firulais");
    assert.equal(recibido.archivo, undefined);
    assert.equal(cuerpo.codigoAnimal, "anim-009");
  } finally {
    await cerrar();
  }
});

test("POST /fichas multipart con archivo entrega la imagen al controlador", async () => {
  let archivoRecibido = null;

  const { url, cerrar } = await levantarApp({
    crearFichaAnimal: async (datos, archivo) => {
      archivoRecibido = archivo;
      return {
        id: 9,
        codigoAnimal: "anim-009",
        estadoEstadia: "ACTIVO",
        imagenUrl: "/uploads/animales/foto.jpg",
        imagenSubidaEn: new Date("2026-11-09T15:40:00.000Z"),
      };
    },
  });

  try {
    const respuesta = await fetch(`${url}/fichas`, {
      method: "POST",
      body: formularioFicha({}, {
        nombre: "foto.jpg",
        tipo: "image/jpeg",
        contenido: JPG,
      }),
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.equal(archivoRecibido.originalname, "foto.jpg");
    assert.equal(archivoRecibido.mimetype, "image/jpeg");
    assert.equal(archivoRecibido.buffer.equals(JPG), true);
    assert.equal(cuerpo.imagenUrl, "/uploads/animales/foto.jpg");
  } finally {
    await cerrar();
  }
});

test("POST /fichas rechaza un archivo que no es jpg ni png", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp({
    crearFichaAnimal: async () => {
      llamadas += 1;
    },
  });

  try {
    const respuesta = await fetch(`${url}/fichas`, {
      method: "POST",
      body: formularioFicha({}, {
        nombre: "foto.gif",
        tipo: "image/gif",
        contenido: Buffer.from("GIF89a"),
      }),
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.code, "FORMATO_IMAGEN_INVALIDO");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("POST /fichas rechaza una imagen de mas de 5 MB", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp({
    crearFichaAnimal: async () => {
      llamadas += 1;
    },
  });

  try {
    const respuesta = await fetch(`${url}/fichas`, {
      method: "POST",
      body: formularioFicha({}, {
        nombre: "foto.jpg",
        tipo: "image/jpeg",
        contenido: Buffer.alloc(5 * 1024 * 1024 + 1),
      }),
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 413);
    assert.equal(cuerpo.code, "IMAGEN_DEMASIADO_GRANDE");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("POST /fichas/:id/imagen devuelve la imagen actualizada", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp({
    guardarImagenAnimal: async (fichaId, archivo, actor) => {
      recibido = { fichaId, archivo, actor };
      return {
        id: 5,
        codigoAnimal: "anim-005",
        imagenUrl: "/uploads/animales/foto.jpg",
        imagenSubidaEn: new Date("2026-11-09T15:40:00.000Z"),
      };
    },
  });

  try {
    const formData = new FormData();
    formData.append("imagen", new Blob([JPG], { type: "image/jpeg" }), "foto.jpg");

    const respuesta = await fetch(`${url}/fichas/5/imagen`, {
      method: "POST",
      body: formData,
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(recibido.fichaId, 5);
    assert.equal(recibido.archivo.originalname, "foto.jpg");
    assert.equal(
      cuerpo.ficha.imagenUrl,
      "/uploads/animales/foto.jpg",
    );
  } finally {
    await cerrar();
  }
});

test("DELETE /fichas/:id/imagen deja la ficha sin imagen", async () => {
  const { url, cerrar } = await levantarApp({
    quitarImagenAnimal: async (fichaId) => ({
      id: fichaId,
      codigoAnimal: "anim-005",
      imagenUrl: null,
      imagenSubidaEn: null,
    }),
  });

  try {
    const respuesta = await fetch(`${url}/fichas/5/imagen`, {
      method: "DELETE",
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.ficha.imagenUrl, null);
    assert.equal(cuerpo.ficha.imagenSubidaEn, null);
  } finally {
    await cerrar();
  }
});

test("GET /fichas devuelve el registro de fichas", async () => {
  const { url, cerrar } = await levantarApp({
    listarFichasAnimal: async () => [
      {
        id: 5,
        codigoAnimal: "anim-005",
        nombre: "Firulais",
        especie: "PERRO",
        observaciones: "Sociable con otros perros.",
        imagenUrl: "/uploads/animales/foto.jpg",
      },
    ],
  });

  try {
    const respuesta = await fetch(`${url}/fichas`);
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.fichas.length, 1);
    assert.equal(cuerpo.fichas[0].imagenUrl, "/uploads/animales/foto.jpg");
    assert.equal(
      cuerpo.fichas[0].observaciones,
      "Sociable con otros perros.",
    );
  } finally {
    await cerrar();
  }
});
