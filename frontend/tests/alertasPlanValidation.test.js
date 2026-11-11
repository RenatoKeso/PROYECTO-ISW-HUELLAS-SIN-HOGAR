import assert from "node:assert/strict";
import test from "node:test";
import {consultaAlertasFormSchema,respuestaAlertasPlanSchema,} from "../src/validations/alertasPlanValidation.js";

test("convierte la anticipacion y permite omitir la fecha", () => {
  const filtros = consultaAlertasFormSchema.parse({
    diasAnticipacion: "7",
    fechaReferencia: "",
  });

  assert.equal(filtros.diasAnticipacion, 7);
  assert.equal(filtros.fechaReferencia, undefined);
});

test("rechaza anticipacion invalida y fechas imposibles", () => {
  for (const dias of ["", "-1", "1.5", "abc"]) {
    const resultado = consultaAlertasFormSchema.safeParse({
        diasAnticipacion: dias,
        fechaReferencia: "",
    });

    assert.equal(resultado.success, false);
  }

  const fechaInvalida = consultaAlertasFormSchema.safeParse({
    diasAnticipacion: "7",
    fechaReferencia: "2026-02-30",
  });

  assert.equal(fechaInvalida.success, false);
});

test("acepta los nuevos tipos y animales sin nombre", () => {
  for (const tipo of ["desparasitacion", "esterilizacion"]) {
    const resultado = respuestaAlertasPlanSchema.safeParse({
        fechaReferencia: "2026-10-12",
        diasAnticipacion: 7,

    alertas: [
        {
            atencionId: 1,
            animalId: 1,
            codigoAnimal: "anim-001",
            nombreAnimal: null,
            tipo,
            fechaProgramada: "2026-10-12",
            estado: "proximo",
            diasRestantes: 0,
        },
      ],
    });

    assert.equal(resultado.success, true);
  }
});