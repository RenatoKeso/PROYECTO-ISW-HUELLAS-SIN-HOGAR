import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import { calcularAlertas } from "../../src/services/alertasSanitarias.service.js";

const evento = (
    fechaProgramada,
    animalId = 1,
    tipo = "vacuna",
) => ({
    animalId,
    tipo,
    fechaProgramada,
});

const consulta = (eventos, diasAnticipacion = 7) => ({
  fechaReferencia: "2026-10-08",
  diasAnticipacion,
  eventos,
});

test("ordena las alertas de menor a mayor cantidad de dias restantes", () => {
    const resultado = calcularAlertas(
    consulta([
        evento("2026-10-15", 3),
        evento("2026-10-08", 2),
        evento("2026-10-05", 1),
        evento("2026-10-16", 4),
    ]),
  );

    assert.deepEqual(resultado.alertas, [
    {
    ...evento("2026-10-05", 1),
    estado: "vencido",
    diasRestantes: -3,
    },
    {
    ...evento("2026-10-08", 2),
    estado: "proximo",
    diasRestantes: 0,
    },
    {
        ...evento("2026-10-15", 3),
        estado: "proximo",
        diasRestantes: 7,
    },
    ]);
});

test("con cero dias incluye los vencidos y los eventos de hoy", () => {
    const resultado = calcularAlertas(
    consulta(
    [
        evento("2026-10-07"),
        evento("2026-10-08"),
        evento("2026-10-09"),
    ],
        0,
    ),
);

    assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.diasRestantes),
    [-1, 0],
);
});

test("acepta los tres tipos de atencion", () => {
    const resultado = calcularAlertas(
    consulta([
        evento("2026-10-08", 1, "vacuna"),
        evento("2026-10-08", 2, "tratamiento"),
        evento("2026-10-08", 3, "control"),
    ]),
);

    assert.equal(resultado.alertas.length, 3);
});

test("rechaza fechas imposibles y formatos incorrectos", () => {
    const fechas = [
    "2026-02-30",
    "08/10/2026",
    "",
    "2026-13-01",
    ];

    for (const fecha of fechas) {
    assert.throws(
        () => calcularAlertas(consulta([evento(fecha)])),
        ZodError,
    );

    assert.throws(
      () =>
        calcularAlertas({
          ...consulta([]),
          fechaReferencia: fecha,
        }),
      ZodError,
    );
  }
});

test("rechaza identificadores que no sean enteros positivos", () => {
  for (const animalId of [0, -1, 1.5, "1", null]) {
    assert.throws(
      () =>
        calcularAlertas(
          consulta([evento("2026-10-08", animalId)]),
        ),
      ZodError,
    );
  }
});

test("rechaza tipos de atencion no admitidos", () => {
  assert.throws(
    () =>
        calcularAlertas(
        consulta([evento("2026-10-08", 1, "cirugia")]),
        ),
    ZodError,
  );
});

test("rechaza anticipacion negativa, decimal o de otro tipo", () => {
  for (const dias of [-1, 1.5, "7", null]) {
    assert.throws(
        () => calcularAlertas(consulta([], dias)),
        ZodError,
    );
  }
});

test("rechaza cuerpos y eventos con estructura incorrecta", () => {
  for (const datos of [null, [], "texto", {}, { eventos: {} }]) {
    assert.throws(() => calcularAlertas(datos), ZodError);
  }

  for (const datos of [null, [], "texto"]) {
    assert.throws(
        () => calcularAlertas(consulta([datos])),
        ZodError,
    );
    }
});

test("no modifica el cuerpo ni los eventos originales", () => {
  const datos = consulta([
    evento("2026-10-10"),
    evento("2026-10-01"),
  ]);

    const original = structuredClone(datos);

    calcularAlertas(datos);

    assert.deepEqual(datos, original);
});

test("una lista vacia devuelve cero alertas", () => {
    assert.deepEqual(
    calcularAlertas(consulta([])).alertas,
    [],
    );
});

test("exige indicar los dias de anticipacion", () => {
  assert.throws(
    () => calcularAlertas({ eventos: [] }),
    ZodError,
  );
});

test("usa la fecha de Chile cuando se omite la referencia", () => {
  // A esta hora UTC todavía es 7 de octubre en Santiago.
  const resultado = calcularAlertas(
    {
      diasAnticipacion: 0,
      eventos: [evento("2026-10-07")],
    },
    new Date("2026-10-08T02:00:00.000Z"),
  );

  assert.equal(resultado.fechaReferencia, "2026-10-07");
  assert.equal(resultado.alertas[0].diasRestantes, 0);
});

test("rechaza una referencia nula y campos desconocidos", () => {
  assert.throws(
    () =>
      calcularAlertas({
        ...consulta([]),
        fechaReferencia: null,
      }),
    ZodError,
  );

    assert.throws(() =>calcularAlertas({...consulta([]),desconocido: true,}),ZodError,);
});