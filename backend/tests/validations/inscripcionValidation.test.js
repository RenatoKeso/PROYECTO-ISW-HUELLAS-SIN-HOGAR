import assert from "node:assert/strict";
import test from "node:test";
import {
  inscripcionCreateSchema,
  inscripcionIdSchema,
  misInscripcionesQuerySchema,
} from "../../src/validations/inscripcionValidation.js";

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

test("el filtro de mis inscripciones es opcional y solo acepta ACTIVA o CANCELADA", () => {
  assert.deepEqual(misInscripcionesQuerySchema.parse({}), {});
  assert.deepEqual(misInscripcionesQuerySchema.parse({ estado: "ACTIVA" }), { estado: "ACTIVA" });
  assert.deepEqual(misInscripcionesQuerySchema.parse({ estado: "CANCELADA" }), { estado: "CANCELADA" });
  assert.equal(misInscripcionesQuerySchema.safeParse({ estado: "activa" }).success, false);
  assert.equal(misInscripcionesQuerySchema.safeParse({ otro: 1 }).success, false);
});

test("el id de la URL se convierte a entero positivo", () => {
  assert.deepEqual(inscripcionIdSchema.parse({ id: "7" }), { id: 7 });
  for (const id of ["0", "-3", "1.5", "abc"]) {
    assert.equal(inscripcionIdSchema.safeParse({ id }).success, false, id);
  }
});

