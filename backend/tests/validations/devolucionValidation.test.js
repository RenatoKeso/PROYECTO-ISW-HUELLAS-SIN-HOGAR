import assert from "node:assert/strict";
import test from "node:test";
import { devolucionSchema } from "../../src/validations/devolucionValidation.js";

const datosValidos = {
  postulacionId: 1,
  receptorId: 1,
  fechaDevolucion: "2026-09-09",
  motivo: "COMPORTAMIENTO",
  detalle: "Mordía los muebles y la familia no pudo manejarlo",
};

test("acepta una devolucion valida", () => {
  const resultado = devolucionSchema.safeParse(datosValidos);
  assert.equal(resultado.success, true);
});

test("rechaza una fecha futura", () => {
  const resultado = devolucionSchema.safeParse({ ...datosValidos, fechaDevolucion: "2999-01-01" });
  assert.equal(resultado.success, false);
  assert.deepEqual(resultado.error.issues[0].path, ["fechaDevolucion"]);
});

test("rechaza un motivo que no esta en la lista", () => {
  const resultado = devolucionSchema.safeParse({ ...datosValidos, motivo: "ABURRIMIENTO" });
  assert.equal(resultado.success, false);
});

test("rechaza un detalle vacio o solo con espacios", () => {
  assert.equal(devolucionSchema.safeParse({ ...datosValidos, detalle: "" }).success, false);
  assert.equal(devolucionSchema.safeParse({ ...datosValidos, detalle: "   " }).success, false);
});

test("rechaza ids que no son numeros positivos", () => {
  assert.equal(devolucionSchema.safeParse({ ...datosValidos, postulacionId: 0 }).success, false);
  assert.equal(devolucionSchema.safeParse({ ...datosValidos, receptorId: "1" }).success, false);
});

test("rechaza campos extra como el animal", () => {
  const resultado = devolucionSchema.safeParse({ ...datosValidos, fichaAnimalId: 1 });
  assert.equal(resultado.success, false);
});