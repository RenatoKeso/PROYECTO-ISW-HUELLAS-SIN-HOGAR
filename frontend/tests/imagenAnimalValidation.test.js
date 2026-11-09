import assert from "node:assert/strict";
import test from "node:test";
import {
  LIMITE_IMAGEN_BYTES,
  validarArchivoImagen,
} from "../src/validations/imagenAnimalValidation.js";

function archivo({
  name = "foto.jpg",
  type = "image/jpeg",
  size = 1024,
} = {}) {
  return { name, type, size, lastModified: 1 };
}

test("acepta archivos jpg y png", () => {
  assert.equal(validarArchivoImagen(archivo()), null);
  assert.equal(
    validarArchivoImagen(archivo({ name: "foto.png", type: "image/png" })),
    null,
  );
});

test("acepta la extension .jpeg", () => {
  assert.equal(
    validarArchivoImagen(archivo({ name: "foto.jpeg" })),
    null,
  );
});

test("rechaza formatos que no son jpg o png", () => {
  assert.equal(
    validarArchivoImagen(archivo({ name: "foto.gif", type: "image/gif" })),
    "Solo se permiten imágenes en formato JPG o PNG",
  );
});

test("rechaza archivos sin extension de imagen", () => {
  assert.equal(
    validarArchivoImagen(archivo({ name: "foto" })),
    "Solo se permiten imágenes en formato JPG o PNG",
  );
});

test("rechaza imagenes de mas de 5 MB", () => {
  assert.equal(
    validarArchivoImagen(archivo({ size: LIMITE_IMAGEN_BYTES + 1 })),
    "La imagen no puede superar los 5 MB",
  );
});

test("no valida cuando no hay archivo seleccionado", () => {
  assert.equal(validarArchivoImagen(null), null);
});
