import test from "node:test";
import assert from "node:assert/strict";

import {
  actualizacionVeterinariaFormSchema,
  registroMedicoSchema,
  registrosMedicosResponseSchema,
  revisionFinalFormSchema,
  revisionInicialFormSchema,
  seguimientoMedicoItemSchema,
} from "../src/validations/registroMedicoValidation.js";

test("revision inicial valida y convierte cuarentena", () => {
  const resultado = revisionInicialFormSchema.parse({
    pesoKg: "12.4",
    clasificacionSalud: "ENFERMO",
    observacionInicial: "  Tos persistente  ",
    requiereCuarentena: "true",
  });

  assert.equal(resultado.pesoKg, 12.4);
  assert.equal(resultado.observacionInicial, "Tos persistente");
  assert.equal(resultado.requiereCuarentena, true);
});

test("revision inicial acepta un peso de hasta 100 kg", () => {
  const resultado = revisionInicialFormSchema.parse({
    pesoKg: "100",
    clasificacionSalud: "ENFERMO",
    observacionInicial: "x",
    requiereCuarentena: true,
  });

  assert.equal(resultado.pesoKg, 100);
});

test("revision inicial rechaza datos invalidos", () => {
  const casos = [
    { pesoKg: 0, clasificacionSalud: "ENFERMO", observacionInicial: "x", requiereCuarentena: true },
    { pesoKg: 100.01, clasificacionSalud: "ENFERMO", observacionInicial: "x", requiereCuarentena: true },
    { pesoKg: 12.4, clasificacionSalud: "LEVE", observacionInicial: "x", requiereCuarentena: true },
    { pesoKg: 12.4, clasificacionSalud: "ENFERMO", observacionInicial: "", requiereCuarentena: true },
    { pesoKg: 12.4, clasificacionSalud: "ENFERMO", observacionInicial: "x", requiereCuarentena: "si" },
  ];

  for (const caso of casos) {
    assert.equal(revisionInicialFormSchema.safeParse(caso).success, false);
  }
});

test("revision final valida y permite listas opcionales", () => {
  const resultado = revisionFinalFormSchema.parse({
    pesoRevalidadoKg: "13.2",
    adoptabilidad: "ADOPTABLE",
    enfermedades: [{ descripcionEnfermedad: "Otitis", tipoEnfermedad: "infecciosa" }],
  });

  assert.equal(resultado.pesoRevalidadoKg, 13.2);
  assert.equal(resultado.enfermedades.length, 1);
});

test("revision final rechaza adoptabilidad o peso invalidos", () => {
  const invalidos = [
    { pesoRevalidadoKg: 0, adoptabilidad: "ADOPTABLE" },
    { pesoRevalidadoKg: 101, adoptabilidad: "ADOPTABLE" },
    { pesoRevalidadoKg: 13.2, adoptabilidad: "MAYBE" },
  ];

  for (const caso of invalidos) {
    assert.equal(revisionFinalFormSchema.safeParse(caso).success, false);
  }
});

test("revision final acepta tratamientos sin fecha de fin", () => {
  const resultado = revisionFinalFormSchema.parse({
    pesoRevalidadoKg: "13.2",
    adoptabilidad: "ADOPTABLE",
    estadoSalud: "",
    tratamientos: [
      {
        descripcionTratamiento: "Antibiótico",
        fechaInicio: "2026-11-04",
        fechaFin: "",
        observaciones: "",
      },
    ],
  });

  assert.equal(resultado.tratamientos.length, 1);
  assert.equal(resultado.tratamientos[0].fechaFin, undefined);
  assert.equal(resultado.estadoSalud, undefined);
});

test("actualizacion acepta opcionales vacios del formulario", () => {
  const resultado = actualizacionVeterinariaFormSchema.parse({
    observacionSeguimiento: "Mejora",
    evolucionEstadoSalud: "MEJORANDO",
    pesoKg: "",
    clasificacionSalud: "",
    observacionInicial: "",
    requiereCuarentena: "",
    fechaRegistro: "",
  });

  assert.equal(resultado.pesoKg, undefined);
  assert.equal(resultado.clasificacionSalud, undefined);
  assert.equal(resultado.observacionInicial, undefined);
  assert.equal(resultado.requiereCuarentena, undefined);
  assert.equal(resultado.fechaRegistro, undefined);
});

test("el seguimiento conserva el autor", () => {
  const resultado = seguimientoMedicoItemSchema.parse({
    id: 1,
    fechaRegistro: "2026-11-05T10:00:00.000Z",
    observacionSeguimiento: "Sin cambios",
    estadoSalud: "NORMAL",
    evolucionEstadoSalud: "ESTABLE",
    createdBy: { id: 2, nombre: "Dra. María López" },
  });

  assert.equal(resultado.createdBy.nombre, "Dra. María López");
});

test("actualizacion exige observacion y evolucion", () => {
  const valido = actualizacionVeterinariaFormSchema.parse({
    observacionSeguimiento: "  Mejora  ",
    evolucionEstadoSalud: "MEJORANDO",
    pesoKg: "10",
    requiereCuarentena: "false",
  });

  assert.equal(valido.observacionSeguimiento, "Mejora");
  assert.equal(valido.pesoKg, 10);
  assert.equal(valido.requiereCuarentena, false);

  assert.equal(
    actualizacionVeterinariaFormSchema.safeParse({
      evolucionEstadoSalud: "MEJORANDO",
    }).success,
    false,
  );
});

test("respuesta de lista valida un registro provisional", () => {
  const respuesta = registrosMedicosResponseSchema.parse({
    message: "ok",
    registros: [
      {
        id: 1,
        animalId: 2,
        estadoValidacion: "PROVISIONAL",
        createdAt: "2026-11-03T10:00:00.000Z",
      },
    ],
  });

  assert.equal(respuesta.registros.length, 1);
});

test("schema de registro rechaza estados invalidos", () => {
  assert.equal(
    registroMedicoSchema.safeParse({
      id: 1,
      animalId: 2,
      estadoValidacion: "RARO",
      createdAt: "2026-11-03T10:00:00.000Z",
    }).success,
    false,
  );
});
