import test from "node:test";
import assert from "node:assert/strict";
import {
  hayCupos,
  turnoYaComenzo,
  plazoVencido,
  seSolapan,
  turnoSolapadoCon,
  evaluarDisponibilidad,
  MOTIVO_NO_DISPONIBLE,
} from "../../src/services/reglasTurnos.js";
import { CODIGO_ERROR_TURNO, errorDeDisponibilidad } from "../../src/entities/turnoErrors.js";

const hora = (texto) => new Date(`2026-11-10T${texto}:00.000Z`);

function turno(inicio, termino, extra = {}) {
  return {
    inicio: hora(inicio),
    termino: hora(termino),
    fechaLimiteInscripcion: hora("02:59"),
    cuposDisponibles: 3,
    ...extra,
  };
}

test("hayCupos exige al menos un cupo disponible", () => {
  assert.equal(hayCupos({ cuposDisponibles: 1 }), true);
  assert.equal(hayCupos({ cuposDisponibles: 0 }), false);
});

test("un turno ya comenzo desde el instante exacto de su inicio", () => {
  const t = turno("12:00", "14:00");
  assert.equal(turnoYaComenzo(t, hora("11:59")), false);
  assert.equal(turnoYaComenzo(t, hora("12:00")), true);
  assert.equal(turnoYaComenzo(t, hora("13:00")), true);
});

test("el plazo vence solo despues de la fecha limite", () => {
  const t = turno("12:00", "14:00", {
    fechaLimiteInscripcion: hora("10:00"),
  });
  assert.equal(plazoVencido(t, hora("09:59")), false);
  assert.equal(plazoVencido(t, hora("10:00")), false);
  assert.equal(
    plazoVencido(t, new Date(hora("10:00").getTime() + 1)),
    true
  );
});

test("dos turnos se solapan parcial o totalmente", () => {
  const base = turno("12:00", "14:00");

  assert.equal(seSolapan(base, turno("13:00", "15:00")), true);
  assert.equal(seSolapan(base, turno("11:00", "13:00")), true);
  assert.equal(seSolapan(base, turno("12:30", "13:30")), true);
  assert.equal(seSolapan(base, turno("11:00", "15:00")), true);
  assert.equal(seSolapan(base, turno("12:00", "14:00")), true);
});

test("dos turnos seguidos o separados no se solapan", () => {
  const base = turno("12:00", "14:00");

  assert.equal(seSolapan(base, turno("14:00", "16:00")), false);
  assert.equal(seSolapan(base, turno("10:00", "12:00")), false);
  assert.equal(seSolapan(base, turno("15:00", "17:00")), false);
  assert.equal(seSolapan(base, turno("08:00", "09:00")), false);
});

test("seSolapan da lo mismo en cualquier orden", () => {
  const a = turno("12:00", "14:00");
  const b = turno("13:00", "15:00");
  assert.equal(seSolapan(a, b), seSolapan(b, a));
});

test("turnoSolapadoCon devuelve el primer turno que choca o null", () => {
  const nuevo = turno("12:00", "14:00");
  const choca = turno("13:00", "15:00");
  const libre = turno("16:00", "18:00");

  assert.equal(turnoSolapadoCon(nuevo, [libre, choca]), choca);
  assert.equal(turnoSolapadoCon(nuevo, [libre]), null);
  assert.equal(turnoSolapadoCon(nuevo, []), null);
});

// evaluarDisponibilidad: un camino por cada regla, en el orden en que se revisan.

const ANTES = hora("01:00");

function turnoAbierto(extra = {}) {
  return { id: 1, estado: "PUBLICADO", ...turno("12:00", "14:00"), ...extra };
}

function inscripcion(id, turnoInscrito) {
  return { id, turnoId: turnoInscrito.id, turno: turnoInscrito };
}

test("un turno publicado, con cupos y sin choques esta disponible", () => {
  assert.deepEqual(evaluarDisponibilidad(turnoAbierto(), [], ANTES), { disponible: true });
});

test("un turno cancelado no esta disponible", () => {
  const resultado = evaluarDisponibilidad(turnoAbierto({ estado: "CANCELADO" }), [], ANTES);
  assert.deepEqual(resultado, { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.CANCELADO });
});

test("un turno que ya comenzo no esta disponible", () => {
  const resultado = evaluarDisponibilidad(turnoAbierto(), [], hora("12:00"));
  assert.equal(resultado.motivo, MOTIVO_NO_DISPONIBLE.YA_COMENZO);
});

test("un turno con el plazo vencido no esta disponible", () => {
  const resultado = evaluarDisponibilidad(turnoAbierto(), [], hora("03:00"));
  assert.equal(resultado.motivo, MOTIVO_NO_DISPONIBLE.PLAZO_VENCIDO);
});

test("si el voluntario ya esta inscrito, no esta disponible", () => {
  const t = turnoAbierto();
  const resultado = evaluarDisponibilidad(t, [inscripcion(10, t)], ANTES);
  assert.equal(resultado.motivo, MOTIVO_NO_DISPONIBLE.YA_INSCRITO);
});

test("un turno sin cupos no esta disponible", () => {
  const resultado = evaluarDisponibilidad(turnoAbierto({ cuposDisponibles: 0 }), [], ANTES);
  assert.equal(resultado.motivo, MOTIVO_NO_DISPONIBLE.SIN_CUPOS);
});

test("si choca con otra inscripcion activa, devuelve el turno con el que choca", () => {
  const otro = { id: 2, ...turno("13:00", "15:00") };
  const resultado = evaluarDisponibilidad(turnoAbierto(), [inscripcion(10, otro)], ANTES);
  assert.deepEqual(resultado, {
    disponible: false,
    motivo: MOTIVO_NO_DISPONIBLE.SOLAPE,
    turnoSolapado: otro,
  });
});

test("un turno seguido de otra inscripcion si esta disponible", () => {
  const otro = { id: 2, ...turno("14:00", "16:00") };
  assert.equal(evaluarDisponibilidad(turnoAbierto(), [inscripcion(10, otro)], ANTES).disponible, true);
});

test("respeta el orden de las reglas: cancelado gana a sin cupos y a solape", () => {
  const otro = { id: 2, ...turno("13:00", "15:00") };
  const t = turnoAbierto({ estado: "CANCELADO", cuposDisponibles: 0 });
  assert.equal(evaluarDisponibilidad(t, [inscripcion(10, otro)], ANTES).motivo, MOTIVO_NO_DISPONIBLE.CANCELADO);
});

test("cada motivo tiene su error con el codigo de siempre", () => {
  const esperados = {
    CANCELADO: CODIGO_ERROR_TURNO.TURNO_CANCELADO,
    YA_COMENZO: CODIGO_ERROR_TURNO.TURNO_YA_COMENZADO,
    PLAZO_VENCIDO: CODIGO_ERROR_TURNO.PLAZO_INSCRIPCION_VENCIDO,
    YA_INSCRITO: CODIGO_ERROR_TURNO.INSCRIPCION_DUPLICADA,
    SIN_CUPOS: CODIGO_ERROR_TURNO.TURNO_SIN_CUPOS,
    SOLAPE: CODIGO_ERROR_TURNO.HORARIO_SOLAPADO,
  };

  assert.deepEqual(Object.keys(esperados).sort(), Object.keys(MOTIVO_NO_DISPONIBLE).sort());

  for (const [motivo, codigo] of Object.entries(esperados)) {
    assert.equal(errorDeDisponibilidad(motivo).codigo, codigo, motivo);
  }
});
