import test from "node:test";
import assert from "node:assert/strict";
import * as backend from "../../src/services/permisosUsuario.js";
import * as frontend from "../../../frontend/src/utils/permisosUsuario.js";

// Cada fila: rol, gestionar turnos, gestionar inscripciones, consultar turnos.
const matriz = [
  ["DIRECTORA", true, false, true],
  ["ENCARGADA_VOLUNTARIADO", true, false, true],
  ["ENCARGADA_ADOPCIONES", false, false, false],
  ["VETERINARIA", false, false, false],
  ["VOLUNTARIO", false, true, true],
  ["VOLUNTARIO_CONFIANZA", false, true, true],
];

const funciones = [
  "puedeGestionarTurnos",
  "puedeGestionarInscripciones",
  "puedeConsultarTurnos",
];

test("la matriz de turnos cubre todos los roles conocidos", () => {
  assert.deepEqual(
    matriz.map(([rol]) => rol).sort(),
    [...backend.ROLES_USUARIO].sort(),
  );
});

for (const [rol, ...esperados] of matriz) {
  test(`turnos: permisos del rol ${rol} coinciden en frontend y backend`, () => {
    funciones.forEach((nombre, indice) => {
      assert.equal(
        backend[nombre]({ rol, activo: true }),
        esperados[indice],
        `backend ${nombre}`,
      );
      assert.equal(
        frontend[nombre]({ rol }),
        esperados[indice],
        `frontend ${nombre}`,
      );
      assert.equal(
        backend[nombre]({ rol, activo: false }),
        false,
        `backend ${nombre} con cuenta inactiva`,
      );
    });
  });
}

test("turnos: usuarios ausentes o con rol desconocido no tienen acceso", () => {
  for (const usuario of [
    null,
    undefined,
    { rol: "DESCONOCIDO", activo: true },
  ]) {
    for (const nombre of funciones) {
      assert.equal(backend[nombre](usuario), false);
      assert.equal(frontend[nombre](usuario), false);
    }
  }
});
