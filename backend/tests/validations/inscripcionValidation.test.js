import assert from "node:assert/strict";
import test from "node:test";
import { inscripcionCreateSchema } from "../../src/validations/inscripcionValidation.js";

test("acepta un turno valido", () => {
  assert.deepEqual(inscripcionCreateSchema.parse({ turnoId: 3 }), { turnoId: 3 });
});

test("el turno es obligatorio", () => {
  assert.equal(inscripcionCreateSchema.safeParse({}).success, false);
});

test("el turno debe ser un entero positivo", () => {
  for (const turnoId of [0, -1, 1.5, "3", null]) {
    assert.equal(inscripcionCreateSchema.safeParse({ turnoId }).success, false, String(turnoId));
  }
});

test("rechaza que el cliente mande al voluntario u otros campos", () => {
  assert.equal(inscripcionCreateSchema.safeParse({ turnoId: 3, voluntarioId: 9 }).success, false);
  assert.equal(inscripcionCreateSchema.safeParse({ turnoId: 3, estado: "ACTIVA" }).success, false);
});