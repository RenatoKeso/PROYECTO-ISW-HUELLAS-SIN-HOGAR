import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import {obtenerAlertasPlan,} from "../../src/services/alertasPlan.service.js";

import {buscarAtencionesPendientes,} from "../../src/repositories/atencionSanitariaRepository.js";

const filtros = {
    fechaReferencia: "2026-10-12",
    diasAnticipacion: "7",
};

function crearAtencion(id, fecha, tipo = "vacuna") {
return {
    id,
    fichaAnimalId: 1,
    tipo,
    fechaProgramada: new Date(`${fecha}T00:00:00.000Z`),

    fichaAnimal: {
        codigoAnimal: "anim-001",
        nombre: "Pepi",
    },
  };
}

test("clasifica y ordena vencidas, hoy y limite inclusive", async () => {
  const resultado = await obtenerAlertasPlan(filtros, {
    buscar: async ({ fechaLimite }) => {
        assert.equal(
        fechaLimite.toISOString().slice(0, 10),
        "2026-10-19"
      );

    return [
        crearAtencion(3, "2026-10-19", "esterilizacion"),
        crearAtencion(1, "2026-10-09"),
        crearAtencion(2, "2026-10-12", "desparasitacion"),
    ];
    },
  });

  assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.diasRestantes),
    [-3, 0, 7]
  );

  assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.estado),
    ["vencido", "proximo", "proximo"]
  );

  assert.equal(resultado.alertas[0].animalId, 1);
  assert.equal(resultado.alertas[0].codigoAnimal, "anim-001");
  assert.equal(resultado.alertas[0].nombreAnimal, "Pepi");
});

test("refleja cambios del plan sin modificar los registros", async () => {
  const registro = crearAtencion(1, "2026-10-19");
  const buscar = async () => [registro];

  const primeraConsulta = await obtenerAlertasPlan(
    filtros,
    { buscar }
  );

  assert.equal(
    primeraConsulta.alertas[0].diasRestantes,
    7
  );

  // Simula una modificación del plan realizada previamente.
  registro.fechaProgramada = new Date(
    "2026-10-14T00:00:00.000Z"
  );

  const original = structuredClone(registro);

  const segundaConsulta = await obtenerAlertasPlan(
    filtros,
    { buscar }
  );

  assert.equal(
    segundaConsulta.alertas[0].diasRestantes,
    2
  );

  assert.deepEqual(registro, original);
});

test("usa la fecha actual de Chile y admite cero alertas", async () => {
  const resultado = await obtenerAlertasPlan(
    { diasAnticipacion: "0" },
    {
      // En Santiago todavía es 11 de octubre.
      ahora: new Date("2026-10-12T02:00:00.000Z"),
      buscar: async () => [],
    }
  );

  assert.equal(resultado.fechaReferencia, "2026-10-11");
  assert.deepEqual(resultado.alertas, []);
});

test("rechaza filtros invalidos antes de consultar", async () => {
  const consultasInvalidas = [
    {},
    { ...filtros, diasAnticipacion: "-1" },
    { ...filtros, diasAnticipacion: "1.5" },
    { ...filtros, diasAnticipacion: "" },
    { ...filtros, fechaReferencia: "2026-02-30" },
    { ...filtros, eventos: [] },
  ];

  for (const consulta of consultasInvalidas) {
    await assert.rejects(
        obtenerAlertasPlan(consulta, {
        buscar: async () => {
        assert.fail(
            "No debe consultar con filtros invalidos"
            );
        },
        }),
    ZodError
    );
  }
});

test("solicita pendientes de animales del refugio hasta el limite", async () => {
  const fechaLimite = new Date(
    "2026-10-19T00:00:00.000Z"
  );

  // Cliente simulado: permite revisar la consulta de Prisma.
  const cliente = {
    atencionSanitaria: {
      findMany: async (consulta) => {
        assert.deepEqual(consulta.where, {
            estado: "PENDIENTE",
            fechaProgramada: {
            lte: fechaLimite,
        },

        fichaAnimal: {
            is: {
                estadoEstadia: {
                in: ["ACTIVO", "ESPERA_ADOPCION"],
                },
            },
        },
    });

        return [];
      },
    },
  };

  const resultado = await buscarAtencionesPendientes(
    { fechaLimite },
    cliente
  );

  assert.deepEqual(resultado, []);
});