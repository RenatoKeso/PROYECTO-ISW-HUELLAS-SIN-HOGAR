import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

import "../src/validations/configuracionZod.js";

test("traduce una opcion invalida a un mensaje entendible", () => {
  const resultado = z.enum(["ADOPTABLE", "NO_ADOPTABLE"]).safeParse("");

  assert.equal(resultado.success, false);
  assert.equal(
    resultado.error.issues[0].message,
    "Selecciona una opción válida",
  );
});

test("marca como obligatorio un texto requerido vacio", () => {
  const resultado = z.string().min(1).safeParse("");

  assert.equal(resultado.success, false);
  assert.equal(resultado.error.issues[0].message, "Este campo es obligatorio");
});

test("explica los limites de largo de un texto", () => {
  const corto = z.string().min(8).safeParse("abc");
  const largo = z.string().max(5).safeParse("abcdef");

  assert.equal(corto.error.issues[0].message, "Escribe al menos 8 caracteres");
  assert.equal(
    largo.error.issues[0].message,
    "El texto no puede superar los 5 caracteres",
  );
});

test("explica cuando falta elegir en una lista", () => {
  const resultado = z.array(z.string()).min(1).safeParse([]);

  assert.equal(
    resultado.error.issues[0].message,
    "Selecciona al menos una opción",
  );
});

test("traduce tipos incorrectos de numero", () => {
  const resultado = z.number().safeParse("abc");

  assert.equal(resultado.error.issues[0].message, "Ingresa un número válido");
});

test("respeta los mensajes propios definidos en cada esquema", () => {
  const resultado = z.string().min(1, "Mensaje propio").safeParse("");

  assert.equal(resultado.error.issues[0].message, "Mensaje propio");
});
