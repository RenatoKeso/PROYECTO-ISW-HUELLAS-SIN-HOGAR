import test from "node:test";
import assert from "node:assert/strict";

import { postulacionFormSchema } from "../src/validations/postulacionValidation.js";

const VALIDA = {
  nombrePostulante: "Ana Soto",
  rutPostulante: "12.345.678-k",
  telefonoPostulante: "9 1234 5678",
  emailPostulante: "",
  tipoVivienda: "CASA",
  otrasMascotas: "   ",
  disponibilidadTiempo: "Tardes libres",
};

test("normaliza el RUT y el telefono, y omite los opcionales vacios", () => {
  const resultado = postulacionFormSchema.parse(VALIDA);

  assert.equal(resultado.rutPostulante, "12345678-K");
  assert.equal(resultado.telefonoPostulante, "912345678");
  assert.equal(resultado.emailPostulante, undefined);
  assert.equal(resultado.otrasMascotas, undefined);
});

test("rechaza un RUT con formato incorrecto", () => {
  const resultado = postulacionFormSchema.safeParse({ ...VALIDA, rutPostulante: "123" });

  assert.equal(resultado.success, false);
  assert.equal(resultado.error.issues[0].path[0], "rutPostulante");
});

test("exige elegir el tipo de vivienda", () => {
  const resultado = postulacionFormSchema.safeParse({ ...VALIDA, tipoVivienda: "" });

  assert.equal(resultado.success, false);
  assert.equal(resultado.error.issues[0].message, "Selecciona el tipo de vivienda");
});

test("rechaza un correo invalido", () => {
  const resultado = postulacionFormSchema.safeParse({ ...VALIDA, emailPostulante: "no-es-correo" });

  assert.equal(resultado.success, false);
  assert.equal(resultado.error.issues[0].path[0], "emailPostulante");
});