import assert from "node:assert/strict";
import test from "node:test";
import { reporteDevolucionSchema } from "../../src/validations/reporteDevolucionValidation.js";

const datosValidos = {
  fechaDesde: "2026-07-01",
  fechaHasta: "2026-09-30"
};

test("acepta un rango de fechas valido", () => {
  const resultado = reporteDevolucionSchema.safeParse(datosValidos);
  assert.equal(resultado.success, true);
});

test("acepta la misma fecha en desde y hasta", () => {
  const resultado = reporteDevolucionSchema.safeParse({ ...datosValidos, fechaHasta: "2026-07-01" });
  assert.equal(resultado.success, true);
});

test("rechaza las fechas al reves", () => {
  const resultado = reporteDevolucionSchema.safeParse({
    ...datosValidos,
    fechaDesde: "2026-09-30",
    fechaHasta: "2026-07-01",
  });
  assert.equal(resultado.success, false);
  assert.deepEqual(resultado.error.issues[0].path, ["fechaHasta"]);
});

test("rechaza una fecha con formato incorrecto", () => {
  const resultado = reporteDevolucionSchema.safeParse({ ...datosValidos, fechaDesde: "01-07-2026" });
  assert.equal(resultado.success, false);
});

test("rechaza que se mande quien genera el reporte", () => {
  const resultado = reporteDevolucionSchema.safeParse({ ...datosValidos, generadoPorId: 1 });
  assert.equal(resultado.success, false);
});

test("rechaza campos que no pertenecen al reporte", () => {
  const resultado = reporteDevolucionSchema.safeParse({ ...datosValidos, motivo: "SALUD" });
  assert.equal(resultado.success, false);
});