import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";
import {crearSaludRouter,} from "../../src/routes/salud.routes.js";
import {obtenerAlertasPlan,} from "../../src/services/alertasPlan.service.js";
import {manejadorErrores,} from "../../src/handlers/manejadorErrores.js";

// Inicia un servidor temporal y lo cierra al finalizar.
async function consultar(parametros) {
  const app = express();

  app.use(
    "/api/salud",
    crearSaludRouter({
      consultar: (filtros) =>
        obtenerAlertasPlan(filtros, {
            ahora: new Date("2026-10-12T12:00:00.000Z"),
            buscar: async () => [],
        }),
    })
);

app.use(manejadorErrores);

    const servidor = app.listen(0, "127.0.0.1");

    try {
    await once(servidor, "listening");

    const puerto = servidor.address().port;

    const respuesta = await fetch(
      `http://127.0.0.1:${puerto}/api/salud/alertas?${parametros}`,
      {
        headers: {
            Connection: "close",
        },
      }
    );

    return {
      status: respuesta.status,
      datos: await respuesta.json(),
    };
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("GET consulta el plan sin enviar eventos", async () => {
  const respuesta = await consultar(
    "diasAnticipacion=7&fechaReferencia=2026-10-12"
  );

  assert.equal(respuesta.status, 200);

  assert.deepEqual(respuesta.datos, {
    fechaReferencia: "2026-10-12",
    diasAnticipacion: 7,
    alertas: [],
  });
});

test("GET usa la fecha actual cuando se omite", async () => {
  const respuesta = await consultar(
    "diasAnticipacion=0"
  );

  assert.equal(respuesta.status, 200);
  assert.equal(
    respuesta.datos.fechaReferencia,
    "2026-10-12"
  );
});

test("GET responde 400 ante filtros invalidos", async () => {
  const filtrosInvalidos = [
    "",
    "diasAnticipacion=-1",
    "diasAnticipacion=1.5",
    "diasAnticipacion=7&fechaReferencia=2026-02-30",
  ];

  for (const filtros of filtrosInvalidos) {
    const respuesta = await consultar(filtros);

    assert.equal(respuesta.status, 400);
    assert.equal(
      respuesta.datos.code,
      "DATOS_INVALIDOS"
    );
  }
});