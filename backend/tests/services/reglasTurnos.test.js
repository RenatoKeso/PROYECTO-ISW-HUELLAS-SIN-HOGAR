import test from "node:test";
import assert from "node:assert/strict";
import {
  hayCupos,
  turnoYaComenzo,
  plazoVencido,
  seSolapan,
  turnoSolapadoCon,
} from "../../src/services/reglasTurnos.js";

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