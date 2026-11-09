import test from "node:test";
import assert from "node:assert/strict";

import {
  construirEntradaActualizacion,
  construirEntradaRevisionFinal,
  construirEntradaRevisionInicial,
  crearActualizacionInicial,
  crearRevisionFinalInicial,
  crearRevisionInicialInicial,
  opcionesEnfermedadesRegistradas,
  opcionesTratamientosRegistrados,
} from "../src/utils/registroMedicoForm.js";

test("revision inicial inicial y entrada", () => {
  const inicial = crearRevisionInicialInicial({
    pesoKg: 12.4,
    clasificacionSalud: "ENFERMO",
    observacionInicial: "Tos",
    requiereCuarentena: true,
  });

  assert.equal(inicial.requiereCuarentena, "true");

  const entrada = construirEntradaRevisionInicial({
    pesoKg: "12.4",
    clasificacionSalud: "ENFERMO",
    observacionInicial: "Tos",
    requiereCuarentena: "true",
  });

  assert.equal(entrada.pesoKg, 12.4);
  assert.equal(entrada.requiereCuarentena, true);
});

test("revision final omite filas vacias y campos opcionales", () => {
  const inicial = crearRevisionFinalInicial({ pesoKg: 12.4, clasificacionSalud: "ENFERMO" });
  assert.equal(inicial.pesoRevalidadoKg, 12.4);

  const entrada = construirEntradaRevisionFinal({
    pesoRevalidadoKg: "13.2",
    adoptabilidad: "ADOPTABLE",
    enfermedades: [{ descripcionEnfermedad: "Otitis" }, { descripcionEnfermedad: "" }],
    tratamientos: [],
    atencionesSanitarias: [{ tipo: "", fechaProgramada: "" }],
  });

  assert.equal(entrada.enfermedades.length, 1);
  assert.equal(entrada.tratamientos, undefined);
  assert.equal(entrada.atencionesSanitarias, undefined);
});

test("revision final limpia fecha de fin vacia en tratamientos", () => {
  const entrada = construirEntradaRevisionFinal({
    pesoRevalidadoKg: "13.2",
    adoptabilidad: "ADOPTABLE",
    tratamientos: [
      {
        descripcionTratamiento: "Antibiótico",
        fechaInicio: "2026-11-04",
        fechaFin: "",
        observaciones: "",
      },
    ],
  });

  assert.equal(entrada.tratamientos[0].fechaFin, undefined);
});

test("actualizacion omite fecha de registro vacia", () => {
  const entrada = construirEntradaActualizacion({
    observacionSeguimiento: "Mejora",
    evolucionEstadoSalud: "MEJORANDO",
    fechaRegistro: "",
  });

  assert.equal(entrada.fechaRegistro, undefined);
});

test("opciones de seguimiento usan las enfermedades y tratamientos existentes", () => {
  const registro = {
    enfermedades: [{ id: 10, descripcionEnfermedad: "Otitis" }],
    tratamientos: [
      { id: 20, descripcionTratamiento: "Antibiótico", fechaInicio: "2026-11-01" },
    ],
  };

  assert.deepEqual(opcionesEnfermedadesRegistradas(registro), [
    { valor: "", texto: "Seleccione..." },
    { valor: "10", texto: "10 · Otitis" },
  ]);
  assert.deepEqual(opcionesTratamientosRegistrados(registro), [
    { valor: "", texto: "Seleccione..." },
    { valor: "20", texto: "20 · Antibiótico" },
  ]);
});

test("actualizacion omite opcionales y filas vacias", () => {
  const inicial = crearActualizacionInicial({ pesoKg: 12.4, clasificacionSalud: "ENFERMO" });
  assert.equal(inicial.pesoKg, 12.4);

  const entrada = construirEntradaActualizacion({
    observacionSeguimiento: "Mejora",
    evolucionEstadoSalud: "MEJORANDO",
    pesoKg: "",
    requiereCuarentena: "",
    enfermedades: [{ descripcionEnfermedad: "" }],
    tratamientos: [{ descripcionTratamiento: "Antibiotico", fechaInicio: "2026-11-04" }],
    atencionesSanitarias: [],
  });

  assert.equal(entrada.pesoKg, undefined);
  assert.equal(entrada.requiereCuarentena, undefined);
  assert.equal(entrada.enfermedades, undefined);
  assert.equal(entrada.tratamientos.length, 1);
  assert.equal(entrada.atencionesSanitarias, undefined);
});
