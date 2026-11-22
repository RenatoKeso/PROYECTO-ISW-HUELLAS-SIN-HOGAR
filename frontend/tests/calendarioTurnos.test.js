import test from "node:test";
import assert from "node:assert/strict";

import {
  aEventos,
  aplicarFiltro,
  estadoVisual,
  filtrosConCuenta,
  hoyEnChile,
  leyendaDe,
  lunesDe,
  pieDelTurno,
  rangoDeHoras,
  sumarDias,
  textoMotivo,
  tituloSemana,
} from "../src/utils/calendarioTurnos.js";

// Turnos como los manda el backend (horas en UTC; Chile en noviembre es UTC-3).
function turno(id, estadoCalendario, extra = {}) {
  return {
    id,
    titulo: `Turno ${id}`,
    estado: "PUBLICADO",
    inicio: "2026-11-19T13:00:00.000Z", // 10:00 en Chile
    termino: "2026-11-19T15:00:00.000Z", // 12:00 en Chile
    cupoMaximo: 5,
    cuposDisponibles: 3,
    yaComenzo: false,
    disponibilidad: { estado: estadoCalendario },
    miInscripcion: null,
    ...extra,
  };
}

const SEMANA = [
  turno(1, "INSCRITO", { miInscripcion: { id: 10, estado: "ACTIVA" } }),
  turno(2, "DISPONIBLE"),
  turno(3, "NO_DISPONIBLE", { cuposDisponibles: 0 }),
  turno(4, "PASADO", { yaComenzo: true, miInscripcion: { id: 11, estado: "ACTIVA" } }),
  turno(5, "CANCELADO", { estado: "CANCELADO" }),
  turno(6, "DISPONIBLE", { miInscripcion: { id: 12, estado: "CANCELADA" } }),
];

test("el voluntario ve el estado que calculo el backend", () => {
  assert.deepEqual(
    SEMANA.map((t) => estadoVisual(t, false)),
    ["inscrito", "disponible", "no-disponible", "pasado", "cancelado", "disponible"],
  );
});

test("la encargada ve cada turno segun sus cupos: cancelado gana a pasado y pasado a lleno", () => {
  assert.equal(estadoVisual(turno(1, null), true), "con-cupos");
  assert.equal(estadoVisual(turno(1, null, { cuposDisponibles: 0 }), true), "lleno");
  assert.equal(estadoVisual(turno(1, null, { cuposDisponibles: 0, yaComenzo: true }), true), "pasado");
  assert.equal(estadoVisual(turno(1, null, { estado: "CANCELADO", yaComenzo: true }), true), "cancelado");
});

test("los filtros del voluntario cuentan sus turnos; mis inscripciones incluye pasadas y canceladas", () => {
  assert.deepEqual(
    filtrosConCuenta(SEMANA, false).map((f) => [f.valor, f.cuenta]),
    [["todos", 6], ["disponibles", 2], ["no-disponibles", 1], ["mias", 3]],
  );
  assert.deepEqual(aplicarFiltro(SEMANA, false, "mias").map((t) => t.id), [1, 4, 6]);
});

test("los filtros de la encargada son otros", () => {
  const semana = [
    turno(1, null),
    turno(2, null, { cuposDisponibles: 0 }),
    turno(3, null, { estado: "CANCELADO" }),
  ];

  assert.deepEqual(
    filtrosConCuenta(semana, true).map((f) => [f.valor, f.cuenta]),
    [["todos", 3], ["con-cupos", 1], ["llenos", 1], ["cancelados", 1]],
  );
});

test("un filtro que no existe muestra todos", () => {
  assert.equal(aplicarFiltro(SEMANA, false, "inventado").length, SEMANA.length);
});

test("la leyenda cambia segun quien mira", () => {
  assert.deepEqual(leyendaDe(false).map((l) => l.estado), ["inscrito", "disponible", "no-disponible", "pasado", "cancelado"]);
  assert.deepEqual(leyendaDe(true).map((l) => l.estado), ["con-cupos", "lleno", "pasado", "cancelado"]);
});

test("el pie de cada bloque dice los cupos o el estado", () => {
  assert.equal(pieDelTurno(turno(2, "DISPONIBLE"), false), "3 cupos libres");
  assert.equal(pieDelTurno(turno(2, "DISPONIBLE", { cuposDisponibles: 1 }), false), "1 cupo libre");
  assert.equal(pieDelTurno(SEMANA[0], false), "Inscrito");
  assert.equal(pieDelTurno(turno(1, null, { cuposDisponibles: 0 }), true), "Lleno · 5/5");
  assert.equal(pieDelTurno(SEMANA[3], false), "Ya pasó");
});

test("cada turno se convierte en un evento con la clase de su color", () => {
  const [evento] = aEventos([SEMANA[0]], false, 1);

  assert.deepEqual(evento, {
    id: "1",
    title: "Turno 1",
    start: "2026-11-19T13:00:00.000Z",
    end: "2026-11-19T15:00:00.000Z",
    classNames: ["evento-turno", "evento-inscrito", "evento-elegido"],
    extendedProps: { pie: "Inscrito", estado: "inscrito" },
  });
  assert.deepEqual(aEventos([SEMANA[2]], false)[0].classNames, ["evento-turno", "evento-no-disponible"]);
});

test("el motivo de solape nombra el turno y su horario en hora de Chile", () => {
  const disponibilidad = {
    motivo: "SOLAPE",
    mensaje: "El horario de este turno se solapa con otra inscripcion activa",
    turnoSolapado: { titulo: "Paseo de perros", inicio: "2026-11-19T13:00:00.000Z", termino: "2026-11-19T15:00:00.000Z" },
  };

  assert.equal(textoMotivo(disponibilidad), 'Se solapa con tu turno "Paseo de perros" (10:00 a 12:00).');
  assert.equal(textoMotivo({ motivo: "SIN_CUPOS", mensaje: "Este turno no tiene cupos disponibles" }), "Este turno no tiene cupos disponibles");
});

test("las semanas se mueven de lunes a lunes, cruzando meses y años", () => {
  assert.equal(lunesDe("2026-11-19"), "2026-11-16");
  assert.equal(lunesDe("2026-11-16"), "2026-11-16");
  assert.equal(lunesDe("2026-11-22"), "2026-11-16");
  assert.equal(sumarDias("2026-11-30", 7), "2026-12-07");
  assert.equal(sumarDias("2026-01-05", -7), "2025-12-29");
});

test("hoy en Chile no depende de la hora UTC", () => {
  // 01:00 UTC del 20 son las 22:00 del 19 en Chile.
  assert.equal(hoyEnChile(new Date("2026-11-20T01:00:00.000Z")), "2026-11-19");
});

test("el titulo de la semana junta el mes cuando no cambia", () => {
  assert.equal(tituloSemana("2026-11-16"), "16 – 22 de noviembre de 2026");
  assert.equal(tituloSemana("2026-11-30"), "30 de noviembre – 6 de diciembre de 2026");
  assert.equal(tituloSemana("2026-12-28"), "28 de diciembre de 2026 – 3 de enero de 2027");
});

test("la grilla va de 08:00 a 20:00 y se agranda si un turno se sale", () => {
  assert.deepEqual(rangoDeHoras(SEMANA), { inicio: "08:00:00", termino: "20:00:00" });
  assert.deepEqual(
    rangoDeHoras([turno(1, null, { inicio: "2026-11-19T09:30:00.000Z", termino: "2026-11-20T00:30:00.000Z" })]),
    { inicio: "06:00:00", termino: "22:00:00" },
  );
  assert.deepEqual(
    rangoDeHoras([turno(1, null, { inicio: "2026-11-20T00:00:00.000Z", termino: "2026-11-20T03:00:00.000Z" })]),
    { inicio: "08:00:00", termino: "24:00:00" },
  );
});
