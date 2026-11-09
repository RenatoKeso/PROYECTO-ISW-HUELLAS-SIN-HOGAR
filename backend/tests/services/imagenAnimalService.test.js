import assert from "node:assert/strict";
import test from "node:test";
import { CODIGO_ERROR_ANIMAL } from "../../src/entities/animalErrors.js";
import { CODIGO_ERROR_IMAGEN } from "../../src/entities/imagenAnimalErrors.js";
import { CARPETA_IMAGENES_ANIMALES } from "../../src/config/almacenamientoImagenes.js";
import {
  crearFicha,
  guardarImagenDeFicha,
  listarFichas,
  quitarImagenDeFicha,
} from "../../src/services/animalService.js";

const ACTOR = { id: 1, rol: "VOLUNTARIO", activo: true };
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function crearArchivo() {
  return {
    originalname: "foto.jpg",
    mimetype: "image/jpeg",
    size: JPG.length,
    buffer: JPG,
  };
}

function crearDependencias(sobrescrituras = {}) {
  const llamadas = {
    escritos: [],
    eliminados: [],
    directorios: [],
    actualizaciones: [],
    creados: [],
    fichas: [],
  };

  return {
    llamadas,
    obtenerFichaAnimalPorId: async (id) => {
      llamadas.fichas.push(id);
      return id === 5
        ? { id: 5, codigoAnimal: "anim-005", imagenUrl: "/uploads/animales/vieja.jpg" }
        : null;
    },
    actualizarFichaAnimal: async (id, data) => {
      llamadas.actualizaciones.push({ id, data });
      return { id, codigoAnimal: "anim-005", ...data };
    },
    crearFichaAnimal: async (data) => {
      llamadas.creados.push(data);
      return { id: 9, codigoAnimal: "anim-009", ...data };
    },
    listarFichasAnimales: async () => [
      { id: 5, codigoAnimal: "anim-005", imagenUrl: null },
    ],
    crearDirectorio: async (ruta) => {
      llamadas.directorios.push(ruta);
    },
    escribirArchivo: async (ruta, contenido) => {
      llamadas.escritos.push({ ruta, contenido });
    },
    eliminarArchivo: async (ruta) => {
      llamadas.eliminados.push(ruta);
    },
    generarNombreArchivo: () => "nueva-imagen",
    ahora: () => new Date("2026-11-09T15:40:00.000Z"),
    ...sobrescrituras,
  };
}

async function capturarError(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }

  return null;
}

test("guardarImagenDeFicha guarda el archivo y actualiza la ficha", async () => {
  const dependencias = crearDependencias();

  const ficha = await guardarImagenDeFicha(
    5,
    crearArchivo(),
    ACTOR,
    dependencias,
  );

  assert.equal(
    ficha.imagenUrl,
    "/uploads/animales/nueva-imagen.jpg",
  );
  assert.equal(dependencias.llamadas.escritos.length, 1);
  assert.equal(
    dependencias.llamadas.escritos[0].ruta,
    `${CARPETA_IMAGENES_ANIMALES}/nueva-imagen.jpg`,
  );
  assert.equal(dependencias.llamadas.actualizaciones[0].id, 5);
  assert.equal(
    dependencias.llamadas.actualizaciones[0].data.imagenUrl,
    "/uploads/animales/nueva-imagen.jpg",
  );
});

test("guardarImagenDeFicha elimina la imagen anterior al reemplazarla", async () => {
  const dependencias = crearDependencias();

  await guardarImagenDeFicha(5, crearArchivo(), ACTOR, dependencias);

  assert.deepEqual(dependencias.llamadas.eliminados, [
    `${CARPETA_IMAGENES_ANIMALES}/vieja.jpg`,
  ]);
});

test("guardarImagenDeFicha exige un archivo", async () => {
  const dependencias = crearDependencias();

  const error = await capturarError(
    guardarImagenDeFicha(5, null, ACTOR, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_IMAGEN.IMAGEN_AUSENTE);
  assert.equal(error.estadoHttp, 400);
  assert.equal(dependencias.llamadas.escritos.length, 0);
});

test("guardarImagenDeFicha rechaza a un actor sin permiso", async () => {
  const dependencias = crearDependencias({
    puedeGestionarFichas: () => false,
  });

  const error = await capturarError(
    guardarImagenDeFicha(5, crearArchivo(), ACTOR, dependencias),
  );

  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(error.estadoHttp, 403);
  assert.equal(dependencias.llamadas.fichas.length, 0);
});

test("guardarImagenDeFicha responde 404 si la ficha no existe", async () => {
  const dependencias = crearDependencias();

  const error = await capturarError(
    guardarImagenDeFicha(99, crearArchivo(), ACTOR, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FICHA_INEXISTENTE);
  assert.equal(error.estadoHttp, 404);
  assert.equal(dependencias.llamadas.escritos.length, 0);
});

test("guardarImagenDeFicha limpia el archivo nuevo si falla la base", async () => {
  const dependencias = crearDependencias({
    actualizarFichaAnimal: async () => {
      throw new Error("connection refused");
    },
  });

  const error = await capturarError(
    guardarImagenDeFicha(5, crearArchivo(), ACTOR, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_IMAGEN.FALLO_GUARDADO_IMAGEN);
  assert.equal(error.estadoHttp, 500);
  assert.deepEqual(dependencias.llamadas.eliminados, [
    `${CARPETA_IMAGENES_ANIMALES}/nueva-imagen.jpg`,
  ]);
});

test("quitarImagenDeFicha deja los campos en null y borra el archivo", async () => {
  const dependencias = crearDependencias();

  const ficha = await quitarImagenDeFicha(5, ACTOR, dependencias);

  assert.equal(ficha.imagenUrl, null);
  assert.equal(dependencias.llamadas.actualizaciones[0].data.imagenUrl, null);
  assert.deepEqual(dependencias.llamadas.eliminados, [
    `${CARPETA_IMAGENES_ANIMALES}/vieja.jpg`,
  ]);
});

test("crearFicha con imagen guarda el archivo y la ruta en la ficha", async () => {
  const dependencias = crearDependencias();

  const ficha = await crearFicha(
    {
      nombre: "Firulais",
      sexoAnimal: "MACHO",
      especie: "PERRO",
    },
    dependencias,
    crearArchivo(),
  );

  assert.equal(ficha.imagenUrl, "/uploads/animales/nueva-imagen.jpg");
  assert.equal(dependencias.llamadas.escritos.length, 1);
  assert.equal(dependencias.llamadas.creados[0].estadoEstadia, "ACTIVO");
});

test("crearFicha con imagen elimina el archivo si falla la base", async () => {
  const dependencias = crearDependencias({
    crearFichaAnimal: async () => {
      throw new Error("connection refused");
    },
  });

  const error = await capturarError(
    crearFicha(
      { sexoAnimal: "MACHO", especie: "PERRO" },
      dependencias,
      crearArchivo(),
    ),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FALLO_GUARDADO_FICHA);
  assert.deepEqual(dependencias.llamadas.eliminados, [
    `${CARPETA_IMAGENES_ANIMALES}/nueva-imagen.jpg`,
  ]);
});

test("listarFichas delega en el repositorio", async () => {
  const dependencias = crearDependencias();

  const fichas = await listarFichas(dependencias);

  assert.equal(fichas.length, 1);
  assert.equal(fichas[0].codigoAnimal, "anim-005");
});
