import assert from "node:assert/strict";
import test from "node:test";
import {
  buscarTurnoPorId,
  cancelarTurno,
  crearTurno,
  listarTurnosEntre,
  listarTurnosParaGestion,
  listarTurnosPublicados,
} from "../../src/repositories/turnoRepository.js";

// Cliente falso: guarda los argumentos con que se le consulta.
function clienteDePrueba(respuesta = []) {
  const consultas = [];

  return {
    consultas,
    cliente: {
      turno: {
        create: async (argumentos) => {
          consultas.push(["create", argumentos]);
          return respuesta;
        },
        findUnique: async (argumentos) => {
          consultas.push(["findUnique", argumentos]);
          return respuesta;
        },
        findMany: async (argumentos) => {
          consultas.push(["findMany", argumentos]);
          return respuesta;
        },
        updateMany: async (argumentos) => {
          consultas.push(["updateMany", argumentos]);
          return respuesta;
        },
      },
    },
  };
}

test("crearTurno guarda los datos y devuelve solo los campos del turno", async () => {
  const { cliente, consultas } = clienteDePrueba({ id: 1 });
  const data = { titulo: "Paseo", cupoMaximo: 3 };

  const turno = await crearTurno(data, cliente);

  assert.deepEqual(turno, { id: 1 });
  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "create");
  assert.equal(argumentos.data, data);
  assert.equal(argumentos.select.id, true);
  assert.equal(argumentos.select.cuposDisponibles, true);
  assert.equal(argumentos.select.estado, true);
});

test("listarTurnosParaGestion trae todos los turnos ordenados por inicio", async () => {
  const { cliente, consultas } = clienteDePrueba([]);

  await listarTurnosParaGestion(cliente);

  const [[, argumentos]] = consultas;
  assert.equal(argumentos.where, undefined);
  assert.deepEqual(argumentos.orderBy, { inicio: "asc" });
});

test("listarTurnosPublicados solo trae turnos publicados que no han comenzado", async () => {
  const { cliente, consultas } = clienteDePrueba([]);
  const ahora = new Date("2026-11-03T15:00:00.000Z");

  await listarTurnosPublicados(ahora, cliente);

  const [[, argumentos]] = consultas;
  assert.deepEqual(argumentos.where, { estado: "PUBLICADO", inicio: { gt: ahora } });
  assert.deepEqual(argumentos.orderBy, { inicio: "asc" });
});

test("buscarTurnoPorId busca por id y devuelve los campos del turno", async () => {
  const { cliente, consultas } = clienteDePrueba({ id: 4 });

  const turno = await buscarTurnoPorId(4, cliente);

  assert.deepEqual(turno, { id: 4 });
  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "findUnique");
  assert.deepEqual(argumentos.where, { id: 4 });
  assert.equal(argumentos.select.cuposDisponibles, true);
});

test("listarTurnosEntre trae los turnos que empiezan en el rango, de cualquier estado", async () => {
  const { cliente, consultas } = clienteDePrueba([]);
  const inicio = new Date("2026-11-16T03:00:00.000Z");
  const fin = new Date("2026-11-23T02:59:59.999Z");

  await listarTurnosEntre(inicio, fin, cliente);

  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "findMany");
  assert.deepEqual(argumentos.where, { inicio: { gte: inicio, lte: fin } });
  assert.deepEqual(argumentos.orderBy, { inicio: "asc" });
  assert.equal(argumentos.select.titulo, true);
});

test("cancelarTurno solo cancela si sigue publicado y no ha comenzado", async () => {
  const { cliente, consultas } = clienteDePrueba({ count: 1 });
  const canceladoEn = new Date("2026-11-18T18:00:00.000Z");

  const resultado = await cancelarTurno(8, { motivo: "Lluvia", canceladoPorId: 2, canceladoEn }, cliente);

  assert.equal(resultado, true);
  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "updateMany");
  assert.deepEqual(argumentos.where, { id: 8, estado: "PUBLICADO", inicio: { gt: canceladoEn } });
  assert.deepEqual(argumentos.data, {
    estado: "CANCELADO",
    motivoCancelacion: "Lluvia",
    canceladoPorId: 2,
    canceladoEn,
  });
});

test("cancelarTurno devuelve false si el turno ya no se podia cancelar", async () => {
  const { cliente } = clienteDePrueba({ count: 0 });

  assert.equal(await cancelarTurno(8, { motivo: "Lluvia", canceladoPorId: 2, canceladoEn: new Date() }, cliente), false);
});
