import test from "node:test";
import assert from "node:assert/strict";
import * as backend from "../../src/services/permisosUsuario.js";
import * as frontend from "../../../frontend/src/utils/permisosUsuario.js";

const esperados = [
  ["DIRECTORA", true],
  ["ENCARGADA_ADOPCIONES", true],
  ["VOLUNTARIO_CONFIANZA", true],
  ["ENCARGADA_VOLUNTARIADO", false],
  ["VETERINARIA", false],
  ["VOLUNTARIO", false],
];

for (const [rol, puede] of esperados) {
  test(`registrar devoluciones: ${rol} ${puede ? "puede" : "no puede"}`, () => {
    assert.equal(backend.puedeRegistrarDevoluciones({ rol, activo: true }), puede);
    assert.equal(frontend.puedeRegistrarDevoluciones({ rol }), puede);
    assert.equal(backend.puedeRegistrarDevoluciones({ rol, activo: false }), false);
  });
}