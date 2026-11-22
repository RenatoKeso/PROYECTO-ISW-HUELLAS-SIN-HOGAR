import test from "node:test";
import assert from "node:assert/strict";

import {
  ESTADO_EN_CALENDARIO,
  obtenerCalendarioVoluntario,
} from "../../src/services/calendarioTurnosService.js";
import { turnoSinCupos } from "../../src/entities/turnoErrors.js";

// "Ahora": miercoles 18 de noviembre de 2026, 15:00 en Chile (18:00 UTC).
const AHORA = new Date("2026-11-18T18:00:00.000Z");
const VOLUNTARIO = { id: 7, rol: "VOLUNTARIO", voluntarioId: 3 };

function turno(id, inicio, termino, extra = {}) {
  return {
    id,
    titulo: `Turno ${id}`,
    estado: "PUBLICADO",
    inicio: new Date(inicio),
    termino: new Date(termino),
    fechaLimiteInscripcion: new Date("2026-11-21T02:59:59.999Z"),
    cupoMaximo: 5,
    cuposDisponibles: 3,
    ...extra,
  };
}

const PASADO = turno(1, "2026-11-16T13:00:00.000Z", "2026-11-16T15:00:00.000Z");
const CANCELADO = turno(2, "2026-11-20T12:00:00.000Z", "2026-11-20T14:00:00.000Z", { estado: "CANCELADO" });
const MIO = turno(3, "2026-11-19T13:00:00.000Z", "2026-11-19T15:00:00.000Z");
const CHOCA = turno(4, "2026-11-19T14:00:00.000Z", "2026-11-19T16:00:00.000Z");
const LLENO = turno(5, "2026-11-20T18:00:00.000Z", "2026-11-20T20:00:00.000Z", { cuposDisponibles: 0 });
const LIBRE = turno(6, "2026-11-20T15:00:00.000Z", "2026-11-20T17:00:00.000Z");
const LO_CANCELE = turno(7, "2026-11-20T21:00:00.000Z", "2026-11-20T23:00:00.000Z");

const TURNOS = [PASADO, CANCELADO, MIO, CHOCA, LLENO, LIBRE, LO_CANCELE];

// Como las entrega el repositorio: la mas reciente primero.
const INSCRIPCIONES = [
  { id: 31, turnoId: 7, estado: "CANCELADA", turno: LO_CANCELE },
  { id: 30, turnoId: 3, estado: "ACTIVA", turno: MIO },
  { id: 29, turnoId: 1, estado: "ACTIVA", turno: PASADO },
];

function dependenciasDePrueba({ turnos = TURNOS, inscripciones = INSCRIPCIONES } = {}) {
  const llamadas = { turnosEntre: [], inscripciones: [] };

  return {
    llamadas,
    listarTurnosEntre: async (inicio, fin) => {
      llamadas.turnosEntre.push({ inicio, fin });
      return turnos;
    },
    listarInscripcionesDeVoluntario: async (voluntarioId) => {
      llamadas.inscripciones.push(voluntarioId);
      return inscripciones;
    },
  };
}

async function calendario(dependencias = dependenciasDePrueba()) {
  return obtenerCalendarioVoluntario({ semana: "2026-11-16" }, VOLUNTARIO, dependencias, AHORA);
}

function porId(resultado) {
  return Object.fromEntries(resultado.turnos.map((t) => [t.id, t]));
}

test("pide los turnos de lunes a domingo en hora de Chile y las inscripciones del voluntario", async () => {
  const dependencias = dependenciasDePrueba();
  const resultado = await calendario(dependencias);

  assert.deepEqual(resultado.semana, { desde: "2026-11-16", hasta: "2026-11-22" });
  assert.equal(dependencias.llamadas.turnosEntre[0].inicio.toISOString(), "2026-11-16T03:00:00.000Z");
  assert.equal(dependencias.llamadas.turnosEntre[0].fin.toISOString(), "2026-11-23T02:59:59.999Z");
  assert.deepEqual(dependencias.llamadas.inscripciones, [3]);
});

test("cada turno trae su estado para el voluntario", async () => {
  const turnos = porId(await calendario());

  assert.equal(turnos[1].disponibilidad.estado, ESTADO_EN_CALENDARIO.PASADO);
  assert.equal(turnos[2].disponibilidad.estado, ESTADO_EN_CALENDARIO.CANCELADO);
  assert.equal(turnos[3].disponibilidad.estado, ESTADO_EN_CALENDARIO.INSCRITO);
  assert.equal(turnos[4].disponibilidad.estado, ESTADO_EN_CALENDARIO.NO_DISPONIBLE);
  assert.equal(turnos[5].disponibilidad.estado, ESTADO_EN_CALENDARIO.NO_DISPONIBLE);
  assert.equal(turnos[6].disponibilidad.estado, ESTADO_EN_CALENDARIO.DISPONIBLE);
  assert.equal(turnos[7].disponibilidad.estado, ESTADO_EN_CALENDARIO.DISPONIBLE);
});

test("un turno que choca trae el motivo, el mensaje y el turno con que choca", async () => {
  const { disponibilidad } = porId(await calendario())[4];

  assert.equal(disponibilidad.motivo, "SOLAPE");
  assert.equal(disponibilidad.mensaje, "El horario de este turno se solapa con otra inscripcion activa");
  assert.deepEqual(disponibilidad.turnoSolapado, {
    id: 3,
    titulo: "Turno 3",
    inicio: MIO.inicio,
    termino: MIO.termino,
  });
});

test("un turno sin cupos trae el mismo mensaje que da la inscripcion", async () => {
  const { disponibilidad } = porId(await calendario())[5];

  assert.equal(disponibilidad.motivo, "SIN_CUPOS");
  assert.equal(disponibilidad.mensaje, turnoSinCupos().message);
  assert.equal(disponibilidad.turnoSolapado, null);
});

test("un turno que ya paso sale como pasado aunque el voluntario estuviera inscrito", async () => {
  const pasado = porId(await calendario())[1];

  assert.equal(pasado.disponibilidad.estado, ESTADO_EN_CALENDARIO.PASADO);
  assert.deepEqual(pasado.miInscripcion, { id: 29, estado: "ACTIVA" });
});

test("cada turno dice si el voluntario tiene o tuvo una inscripcion en el", async () => {
  const turnos = porId(await calendario());

  assert.deepEqual(turnos[3].miInscripcion, { id: 30, estado: "ACTIVA" });
  assert.deepEqual(turnos[7].miInscripcion, { id: 31, estado: "CANCELADA" });
  assert.equal(turnos[6].miInscripcion, null);
});

test("si cancelo y se volvio a inscribir, manda la inscripcion activa", async () => {
  const dependencias = dependenciasDePrueba({
    turnos: [LIBRE],
    inscripciones: [
      { id: 41, turnoId: 6, estado: "ACTIVA", turno: LIBRE },
      { id: 40, turnoId: 6, estado: "CANCELADA", turno: LIBRE },
    ],
  });
  const [libre] = (await calendario(dependencias)).turnos;

  assert.equal(libre.disponibilidad.estado, ESTADO_EN_CALENDARIO.INSCRITO);
  assert.deepEqual(libre.miInscripcion, { id: 41, estado: "ACTIVA" });
});

test("cada turno mantiene los datos de la tarjeta (inscritos e inscripcion abierta)", async () => {
  const turnos = porId(await calendario());

  assert.equal(turnos[6].inscritos, 2);
  assert.equal(turnos[6].inscripcionAbierta, true);
  assert.equal(turnos[5].inscripcionAbierta, false);
});

test("una cuenta sin voluntario vinculado no tiene calendario", async () => {
  const dependencias = dependenciasDePrueba();

  await assert.rejects(
    obtenerCalendarioVoluntario({ semana: "2026-11-16" }, { id: 9, rol: "VOLUNTARIO" }, dependencias, AHORA),
    { codigo: "VOLUNTARIO_NO_VINCULADO" },
  );
  assert.equal(dependencias.llamadas.turnosEntre.length, 0);
});
