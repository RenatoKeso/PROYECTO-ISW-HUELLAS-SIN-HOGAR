import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import "../../src/validations/configuracionZod.js";

test("traduce una opcion invalida a un mensaje entendible", () => {
  const resultado = z.enum(["ADOPTABLE", "NO_ADOPTABLE"]).safeParse("");

  assert.equal(resultado.success, false);
  assert.equal(
    resultado.error.issues[0].message,
    "Selecciona una opción válida",
  );
});

test("marca como obligatorio un campo requerido vacio", () => {
  const resultado = z.string().min(1).safeParse("");

  assert.equal(resultado.success, false);
  assert.equal(resultado.error.issues[0].message, "Este campo es obligatorio");
});

test("traduce tipos incorrectos de numero", () => {
  const resultado = z.number().safeParse("abc");

  assert.equal(resultado.error.issues[0].message, "Ingresa un número válido");
});

test("respeta los mensajes propios definidos en cada esquema", () => {
  const resultado = z
    .enum(["ADOPTABLE", "NO_ADOPTABLE"], {
      message: "Debe indicar si el animal es adoptable o no adoptable",
    })
    .safeParse("");

  assert.equal(
    resultado.error.issues[0].message,
    "Debe indicar si el animal es adoptable o no adoptable",
  );
});
