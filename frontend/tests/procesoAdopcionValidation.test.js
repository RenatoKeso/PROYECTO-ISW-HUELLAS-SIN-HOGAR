import test from "node:test";
import assert from "node:assert/strict";

import {
  entregaFormSchema,
  omisionFormSchema,
  visitaFormSchema,
} from "../src/validations/postulacionValidation.js";

test("la visita exige fecha y resultado, y omite observaciones vacias", () => {
  const valida = visitaFormSchema.parse({
    fechaVisita: "2026-10-31",
    resultado: "FAVORABLE",
    observaciones: "  ",
  });

  assert.equal(valida.observaciones, undefined);

  const invalida = visitaFormSchema.safeParse({ fechaVisita: "", resultado: "", observaciones: "" });
  const campos = invalida.error.issues.map((issue) => issue.path[0]);

  assert.ok(campos.includes("fechaVisita"));
  assert.ok(campos.includes("resultado"));
});

test("omitir con motivo OTRO exige explicar en la observacion", () => {
  const sinExplicar = omisionFormSchema.safeParse({ motivo: "OTRO", observacion: "" });

  assert.equal(sinExplicar.success, false);
  assert.equal(sinExplicar.error.issues[0].path[0], "observacion");

  const conMotivoDeLista = omisionFormSchema.safeParse({ motivo: "DISTANCIA", observacion: "" });
  assert.equal(conMotivoDeLista.success, true);
});

test("la entrega exige fecha y documentacion", () => {
  const resultado = entregaFormSchema.safeParse({ fechaEntrega: "", documentacionEntregada: "" });
  const campos = resultado.error.issues.map((issue) => issue.path[0]);

  assert.ok(campos.includes("fechaEntrega"));
  assert.ok(campos.includes("documentacionEntregada"));
});