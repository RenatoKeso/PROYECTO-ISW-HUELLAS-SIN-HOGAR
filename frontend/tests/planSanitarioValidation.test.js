import assert from "node:assert/strict";
import test from "node:test";
import {
  programarAtencionSchema,
  modificarAtencionSchema,
  respuestaPlanSchema,
} from "../src/validations/planSanitarioValidation.js";

test("el formulario permite los cinco tipos y rechaza fechas o estados enviados indebidamente", () => {
  for (const tipo of [
    "vacuna",
    "tratamiento",
    "control",
    "desparasitacion",
    "esterilizacion",
  ]) {
    assert.equal(
      programarAtencionSchema.safeParse({
        tipo,
        fechaProgramada: "2026-11-02",
      }).success,
      true
    );
  }

  for (const fechaProgramada of [
    "",
    "2026-02-30",
    "02/11/2026",
  ]) {
    assert.equal(
      programarAtencionSchema.safeParse({
        tipo: "vacuna",
        fechaProgramada,
      }).success,
      false
    );
  }

  assert.equal(
    programarAtencionSchema.safeParse({
      tipo: "vacuna",
      fechaProgramada: "2026-11-02",
      estado: "REALIZADA",
    }).success,
    false
  );
});

test("las acciones exigen la fecha o el motivo correspondiente", () => {
  for (const entrada of [
    {
      accion: "reprogramar",
      fechaProgramada: "2026-11-09",
    },
    {
      accion: "realizar",
      fechaRealizacion: "2026-11-02",
    },
    {
      accion: "cancelar",
      motivoCancelacion: "Cambio de indicacion",
    },
  ]) {
    assert.equal(
      modificarAtencionSchema.safeParse(entrada).success,
      true
    );
  }

  for (const entrada of [
    {
      accion: "cancelar",
      motivoCancelacion: " ",
    },
    {
      accion: "realizar",
    },
    {
      accion: "reprogramar",
      fechaProgramada: "2026-02-30",
    },
    {
      accion: "eliminar",
    },
  ]) {
    assert.equal(
      modificarAtencionSchema.safeParse(entrada).success,
      false
    );
  }
});

test("la respuesta admite un animal sin nombre y detecta respuestas incompletas", () => {
  const respuesta = {
    animal: {
      id: 1,
      codigoAnimal: "anim-001",
      nombre: null,
      estadoEstadia: "ACTIVO",
      registroMedicoId: null,
    },
    atenciones: [],
  };

  assert.equal(
    respuestaPlanSchema.safeParse(respuesta).success,
    true
  );

  assert.equal(
    respuestaPlanSchema.safeParse({
      ...respuesta,
      animal: { id: 1 },
    }).success,
    false
  );
});