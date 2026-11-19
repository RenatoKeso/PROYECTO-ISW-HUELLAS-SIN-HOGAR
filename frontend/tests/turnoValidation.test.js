import test from "node:test";
import assert from "node:assert/strict";

import { MENSAJE_TITULO, turnoFormSchema } from "../src/validations/turnoValidation.js";

// Lo que entrega el formulario: todo como texto, igual que los inputs.
const FORMULARIO = {
  titulo: "Paseo de perros",
  descripcion: "",
  fecha: "2026-11-25",
  horaInicio: "10:00",
  horaTermino: "12:00",
  fechaLimiteInscripcion: "2026-11-24",
  cupoMaximo: "5",
};

function mensajesDelTitulo(titulo) {
  const resultado = turnoFormSchema.safeParse({ ...FORMULARIO, titulo });
  assert.equal(resultado.success, false);
  return resultado.error.issues.map((issue) => issue.message);
}

test("convierte el cupo a numero y omite la descripcion vacia", () => {
  const resultado = turnoFormSchema.parse(FORMULARIO);

  assert.equal(resultado.cupoMaximo, 5);
  assert.equal(resultado.descripcion, undefined);
});

test("acepta un titulo con tildes, ñ, comas y guiones", () => {
  for (const titulo of ["Baño de gatos", "Paseo de perros, turno mañana", "Limpieza - patio norte"]) {
    assert.equal(turnoFormSchema.safeParse({ ...FORMULARIO, titulo }).success, true, titulo);
  }
});

test("quita los espacios del titulo antes de revisarlo", () => {
  assert.equal(turnoFormSchema.parse({ ...FORMULARIO, titulo: "  Limpieza  " }).titulo, "Limpieza");
});

test("rechaza un titulo con numeros o caracteres especiales", () => {
  for (const titulo of ["Turno 2", "Paseo!", "Baño @ refugio", "Limpieza.", "Turno #1"]) {
    assert.deepEqual(mensajesDelTitulo(titulo), [MENSAJE_TITULO], titulo);
  }
});

test("el titulo debe empezar con una letra", () => {
  assert.deepEqual(mensajesDelTitulo("- Paseo"), [MENSAJE_TITULO]);
});

test("un titulo vacio da un solo error, el de obligatorio", () => {
  assert.deepEqual(mensajesDelTitulo(""), ["El título es obligatorio"]);
  assert.deepEqual(mensajesDelTitulo("   "), ["El título es obligatorio"]);
});

test("respeta el largo maximo de 120 caracteres", () => {
  assert.equal(turnoFormSchema.safeParse({ ...FORMULARIO, titulo: "a".repeat(120) }).success, true);
  assert.deepEqual(mensajesDelTitulo("a".repeat(121)), ["El título no puede superar los 120 caracteres"]);
});
