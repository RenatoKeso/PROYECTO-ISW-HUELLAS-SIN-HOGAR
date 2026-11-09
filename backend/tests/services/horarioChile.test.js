import test from "node:test";
import assert from "node:assert/strict";
import {
  instanteEnChile,
  finDelDiaEnChile,
  fechaYHoraEnChile,
} from "../../src/services/horarioChile.js";

const iso = (fecha) => fecha?.toISOString() ?? null;

test("en verano Chile va 3 horas detras de UTC", () => {
  assert.equal(
    iso(instanteEnChile("2026-11-10", "09:00")),
    "2026-11-10T12:00:00.000Z"
  );
});

test("en invierno Chile va 4 horas detras de UTC", () => {
  assert.equal(
    iso(instanteEnChile("2026-07-15", "09:00")),
    "2026-07-15T13:00:00.000Z"
  );
});

test("una hora de la noche de Chile cae en el dia siguiente en UTC", () => {
  assert.equal(
    iso(instanteEnChile("2026-11-10", "23:30")),
    "2026-11-11T02:30:00.000Z"
  );
});

test("rechaza formatos incorrectos y fechas que no existen", () => {
  assert.equal(instanteEnChile("2026-02-30", "09:00"), null);
  assert.equal(instanteEnChile("2026-13-01", "09:00"), null);
  assert.equal(instanteEnChile("10-11-2026", "09:00"), null);
  assert.equal(instanteEnChile("2026-11-10", "24:00"), null);
  assert.equal(instanteEnChile("2026-11-10", "9:00"), null);
  assert.equal(instanteEnChile("2026-11-10", "09:60"), null);
  assert.equal(instanteEnChile(undefined, "09:00"), null);
  assert.equal(instanteEnChile("2026-11-10", null), null);
});

test("fechaYHoraEnChile deshace instanteEnChile", () => {
  for (const [fecha, hora] of [
    ["2026-11-10", "09:00"],
    ["2026-07-15", "18:45"],
    ["2026-12-31", "23:59"],
    ["2027-01-01", "00:00"],
  ]) {
    assert.deepEqual(
      fechaYHoraEnChile(instanteEnChile(fecha, hora)),
      { fecha, hora }
    );
  }
});

test("la medianoche de UTC todavia es el dia anterior en Chile", () => {
  assert.deepEqual(
    fechaYHoraEnChile(new Date("2026-11-11T02:30:00Z")),
    { fecha: "2026-11-10", hora: "23:30" }
  );
});

test("la hora que se salta al adelantar el reloj no existe", () => {
  // El 5 de septiembre de 2026 a las 24:00 los relojes pasan a las 01:00.
  assert.equal(instanteEnChile("2026-09-06", "00:30"), null);
  assert.equal(
    iso(instanteEnChile("2026-09-06", "01:00")),
    "2026-09-06T04:00:00.000Z"
  );
});

test("la hora repetida al atrasar el reloj usa la primera ocurrencia", () => {
  // El 4 de abril de 2026 a las 24:00 los relojes vuelven a las 23:00.
  assert.equal(
    iso(instanteEnChile("2026-04-04", "23:30")),
    "2026-04-05T02:30:00.000Z"
  );
});

test("el fin del dia es el ultimo milisegundo de ese dia en Chile", () => {
  assert.equal(
    iso(finDelDiaEnChile("2026-11-10")),
    "2026-11-11T02:59:59.999Z"
  );
  assert.equal(
    iso(finDelDiaEnChile("2026-07-15")),
    "2026-07-16T03:59:59.999Z"
  );

  const fin = finDelDiaEnChile("2026-11-10");
  assert.deepEqual(fechaYHoraEnChile(fin), {
    fecha: "2026-11-10",
    hora: "23:59",
  });
  assert.deepEqual(
    fechaYHoraEnChile(new Date(fin.getTime() + 1)),
    { fecha: "2026-11-11", hora: "00:00" }
  );
});

test("el fin del dia funciona en los dias del cambio de horario", () => {
  // Dia en que se adelanta el reloj: el dia siguiente parte a la 01:00.
  assert.equal(
    iso(finDelDiaEnChile("2026-09-05")),
    "2026-09-06T03:59:59.999Z"
  );
  // Dia en que se atrasa el reloj: el fin es el de la segunda 23:59.
  assert.equal(
    iso(finDelDiaEnChile("2026-04-04")),
    "2026-04-05T03:59:59.999Z"
  );
});

test("el fin del dia rechaza fechas que no existen", () => {
  assert.equal(finDelDiaEnChile("2026-02-29"), null);
  assert.equal(finDelDiaEnChile("2026-11-31"), null);
  assert.equal(finDelDiaEnChile("no es una fecha"), null);
  assert.equal(
    iso(finDelDiaEnChile("2028-02-29")),
    "2028-03-01T02:59:59.999Z"
  );
});