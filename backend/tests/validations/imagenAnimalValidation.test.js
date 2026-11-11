import assert from "node:assert/strict";
import test from "node:test";
import { CODIGO_ERROR_IMAGEN } from "../../src/entities/imagenAnimalErrors.js";
import { validarImagenParaSubir } from "../../src/validations/imagenAnimalValidation.js";

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

function archivo({
  originalname = "foto.jpg",
  mimetype = "image/jpeg",
  buffer = JPG,
} = {}) {
  return { originalname, mimetype, size: buffer.length, buffer };
}

function codigoDelError(archivoInvalido) {
  try {
    validarImagenParaSubir(archivoInvalido);
  } catch (error) {
    return error.codigo;
  }

  return null;
}

test("acepta una imagen jpg valida", () => {
  assert.equal(validarImagenParaSubir(archivo()), "jpg");
});

test("acepta una imagen png valida", () => {
  assert.equal(
    validarImagenParaSubir(
      archivo({
        originalname: "foto.png",
        mimetype: "image/png",
        buffer: PNG,
      }),
    ),
    "png",
  );
});

test("acepta la extension .jpeg y la normaliza a jpg", () => {
  assert.equal(
    validarImagenParaSubir(archivo({ originalname: "foto.jpeg" })),
    "jpg",
  );
});

test("rechaza formatos que no sean jpg o png", () => {
  const error = codigoDelError(
    archivo({
      originalname: "foto.gif",
      mimetype: "image/gif",
      buffer: Buffer.from("GIF89a"),
    }),
  );

  assert.equal(error, CODIGO_ERROR_IMAGEN.FORMATO_IMAGEN_INVALIDO);
});

test("rechaza un jpg con contenido que no corresponde al formato", () => {
  const error = codigoDelError(
    archivo({ buffer: Buffer.from([0x00, 0x01, 0x02, 0x03]) }),
  );

  assert.equal(error, CODIGO_ERROR_IMAGEN.FORMATO_IMAGEN_INVALIDO);
});

test("rechaza un png cuya firma no coincide con el MIME", () => {
  const error = codigoDelError(
    archivo({
      originalname: "foto.png",
      mimetype: "image/png",
      buffer: JPG,
    }),
  );

  assert.equal(error, CODIGO_ERROR_IMAGEN.FORMATO_IMAGEN_INVALIDO);
});

test("rechaza una imagen vacia", () => {
  const error = codigoDelError(
    archivo({ buffer: Buffer.alloc(0) }),
  );

  assert.equal(error, CODIGO_ERROR_IMAGEN.FORMATO_IMAGEN_INVALIDO);
});
