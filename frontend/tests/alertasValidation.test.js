import assert from "node:assert/strict";
import test from "node:test";
import {alertasFormSchema,respuestaAlertasSchema,} from "../src/validations/alertasValidation.js";

const formulario = {
    fechaReferencia: "2026-10-09",
    diasAnticipacion: "7",
    eventos: [
    {
    idLocal: 1,
    animalId: "3",
    tipo: "vacuna",
    fechaProgramada: "2026-10-16",
    },
],
};

test("convierte numeros y elimina el identificador local", () => {
const datos = alertasFormSchema.parse(formulario);

assert.equal(datos.diasAnticipacion, 7);
assert.equal(datos.eventos[0].animalId, 3);
assert.equal("idLocal" in datos.eventos[0], false);
});

test("omite la fecha de referencia cuando esta vacia", () => {
  const datos = alertasFormSchema.parse({
    ...formulario,
    fechaReferencia: "",
  });

  const datosEnviados = JSON.parse(JSON.stringify(datos));

  assert.equal("fechaReferencia" in datosEnviados, false);
});

test("rechaza anticipacion vacia, negativa, decimal o texto", () => {
  for (const dias of ["", "   ", "-1", "1.5", "abc"]) {
    const resultado = alertasFormSchema.safeParse({
      ...formulario,
      diasAnticipacion: dias,
    });

    assert.equal(resultado.success, false);
  }
});

test("rechaza identificadores que no sean enteros positivos", () => {
  for (const animalId of ["", "0", "-1", "1.5", "abc"]) {
    const resultado = alertasFormSchema.safeParse({
      ...formulario,
      eventos: [
        {
          ...formulario.eventos[0],
          animalId,
        },
      ],
    });

    assert.equal(resultado.success, false);
  }
});

test("rechaza fechas imposibles y tipos no admitidos", () => {
  const fechaInvalida = alertasFormSchema.safeParse({
    ...formulario,
    fechaReferencia: "2026-02-30",
  });

  assert.equal(fechaInvalida.success, false);

  const tipoInvalido = alertasFormSchema.safeParse({
    ...formulario,
    eventos: [
      {
        ...formulario.eventos[0],
        tipo: "cirugia",
      },
    ],
  });

  assert.equal(tipoInvalido.success, false);
});

test("acepta anticipacion cero y una lista vacia", () => {
  const resultado = alertasFormSchema.safeParse({
    ...formulario,
    diasAnticipacion: "0",
    eventos: [],
  });

  assert.equal(resultado.success, true);
});

test("valida la respuesta y rechaza estados desconocidos", () => {
  const respuesta = {
    fechaReferencia: "2026-10-09",
    diasAnticipacion: 7,
    alertas: [
      {
        animalId: 3,
        tipo: "vacuna",
        fechaProgramada: "2026-10-16",
        estado: "proximo",
        diasRestantes: 7,
      },
    ],
};

  assert.equal(
    respuestaAlertasSchema.safeParse(respuesta).success,
    true
  );

  const respuestaInvalida = {
    ...respuesta,
    alertas: [
      {
        ...respuesta.alertas[0],
        estado: "desconocido",
      },
    ],
  };

  assert.equal(
    respuestaAlertasSchema.safeParse(respuestaInvalida).success,
    false
  );

  assert.equal(
    respuestaAlertasSchema.safeParse({ alertas: [] }).success,
    false
  );
});