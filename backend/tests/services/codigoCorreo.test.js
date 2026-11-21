import test from "node:test";
import assert from "node:assert/strict";
import { crearCodigo, codigoEsValido, borrarCodigo } from "../../src/services/codigoCorreoService.js";

test("el código tiene 6 números y sirve para ese correo", () => {
  const codigo = crearCodigo("ana@gmail.com");

  assert.match(codigo, /^\d{6}$/);
  assert.equal(codigoEsValido("ana@gmail.com", codigo), true);
});

test("un código equivocado o de otro correo no sirve", () => {
  const codigo = crearCodigo("luis@gmail.com");
  const otro = codigo === "123456" ? "654321" : "123456";

  assert.equal(codigoEsValido("luis@gmail.com", otro), false);
  assert.equal(codigoEsValido("otra@gmail.com", codigo), false);
});

test("después de borrarlo, el código ya no sirve", () => {
  const codigo = crearCodigo("sofi@gmail.com");
  borrarCodigo("sofi@gmail.com");

  assert.equal(codigoEsValido("sofi@gmail.com", codigo), false);
});