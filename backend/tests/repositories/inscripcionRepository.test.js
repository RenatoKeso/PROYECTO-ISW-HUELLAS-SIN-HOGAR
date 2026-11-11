import assert from "node:assert/strict";
import test from "node:test";
import {
  buscarInscripcionPorId,
  cambiarTurnoDeInscripcion,
  cancelarInscripcion,
  crearInscripcion,
  liberarCupo,
  listarHistorialDeInscripcion,
  listarInscripcionesActivasDeVoluntario,
  listarInscripcionesDeVoluntario,
  registrarHistorial,
  reservarCupo,
} from "../../src/repositories/inscripcionRepository.js";

// Cliente falso: guarda los argumentos con que se le consulta.
function clienteDePrueba(respuesta) {
  const consultas = [];
  const registrar = (nombre) => async (argumentos) => {
    consultas.push([nombre, argumentos]);
    return respuesta;
  };

  return {
    consultas,
    cliente: {
      turno: {
        updateMany: registrar("turno.updateMany"),
        update: registrar("turno.update"),
      },
      inscripcionTurno: {
        findMany: registrar("inscripcion.findMany"),
        findUnique: registrar("inscripcion.findUnique"),
        create: registrar("inscripcion.create"),
        update: registrar("inscripcion.update"),
      },
      historialInscripcion: {
        create: registrar("historial.create"),
        findMany: registrar("historial.findMany"),
      },
    },
  };
}

test("reservarCupo descuenta un cupo solo si el turno esta publicado y tiene cupos", async () => {
  const { cliente, consultas } = clienteDePrueba({ count: 1 });

  assert.equal(await reservarCupo(3, cliente), true);

  const [[, argumentos]] = consultas;
  assert.deepEqual(argumentos.where, { id: 3, estado: "PUBLICADO", cuposDisponibles: { gt: 0 } });
  assert.deepEqual(argumentos.data, { cuposDisponibles: { decrement: 1 } });
});

test("reservarCupo devuelve false si no habia cupo que tomar", async () => {
  const { cliente } = clienteDePrueba({ count: 0 });

  assert.equal(await reservarCupo(3, cliente), false);
});

test("listarInscripcionesActivasDeVoluntario trae solo las activas de ese voluntario", async () => {
  const { cliente, consultas } = clienteDePrueba([]);

  await listarInscripcionesActivasDeVoluntario(4, cliente);

  const [[, argumentos]] = consultas;
  assert.deepEqual(argumentos.where, { voluntarioId: 4, estado: "ACTIVA" });
  assert.equal(argumentos.select.turno.select.inicio, true);
  assert.equal(argumentos.select.turno.select.termino, true);
});

test("crearInscripcion devuelve la inscripcion con su turno", async () => {
  const { cliente, consultas } = clienteDePrueba({ id: 1 });
  const data = { turnoId: 3, voluntarioId: 4 };

  await crearInscripcion(data, cliente);

  const [[, argumentos]] = consultas;
  assert.equal(argumentos.data, data);
  assert.equal(argumentos.select.estado, true);
  assert.equal(argumentos.select.turno.select.titulo, true);
});

test("registrarHistorial guarda la fila recibida", async () => {
  const { cliente, consultas } = clienteDePrueba({});
  const data = { inscripcionId: 1, accion: "INSCRIPCION", turnoId: 3, realizadoPorId: 20 };

  await registrarHistorial(data, cliente);

  assert.equal(consultas[0][1].data, data);
});

test("listarInscripcionesDeVoluntario filtra por estado solo si se pide", async () => {
  const sinFiltro = clienteDePrueba([]);
  await listarInscripcionesDeVoluntario(4, undefined, sinFiltro.cliente);
  assert.deepEqual(sinFiltro.consultas[0][1].where, { voluntarioId: 4 });
  assert.deepEqual(sinFiltro.consultas[0][1].orderBy, { createdAt: "desc" });

  const conFiltro = clienteDePrueba([]);
  await listarInscripcionesDeVoluntario(4, "CANCELADA", conFiltro.cliente);
  assert.deepEqual(conFiltro.consultas[0][1].where, { voluntarioId: 4, estado: "CANCELADA" });
});

test("buscarInscripcionPorId busca por id con su turno", async () => {
  const { cliente, consultas } = clienteDePrueba({ id: 9 });

  assert.deepEqual(await buscarInscripcionPorId(9, cliente), { id: 9 });
  assert.equal(consultas[0][0], "inscripcion.findUnique");
  assert.deepEqual(consultas[0][1].where, { id: 9 });
  assert.equal(consultas[0][1].select.turno.select.inicio, true);
});

test("listarHistorialDeInscripcion trae el historial en orden cronologico", async () => {
  const { cliente, consultas } = clienteDePrueba([]);

  await listarHistorialDeInscripcion(9, cliente);

  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "historial.findMany");
  assert.deepEqual(argumentos.where, { inscripcionId: 9 });
  assert.deepEqual(argumentos.orderBy, { fecha: "asc" });
  assert.equal(argumentos.select.turnoAnterior.select.titulo, true);
  assert.equal(argumentos.select.realizadoPor.select.nombre, true);
});

test("liberarCupo suma un cupo al turno", async () => {
  const { cliente, consultas } = clienteDePrueba({});

  await liberarCupo(3, cliente);

  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "turno.update");
  assert.deepEqual(argumentos.where, { id: 3 });
  assert.deepEqual(argumentos.data, { cuposDisponibles: { increment: 1 } });
});

test("cancelarInscripcion cambia el estado y guarda cuando se cancelo", async () => {
  const { cliente, consultas } = clienteDePrueba({ id: 9 });
  const cuando = new Date("2026-11-03T15:00:00.000Z");

  await cancelarInscripcion(9, cuando, cliente);

  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "inscripcion.update");
  assert.deepEqual(argumentos.where, { id: 9 });
  assert.deepEqual(argumentos.data, { estado: "CANCELADA", canceladaEn: cuando });
  assert.equal(argumentos.select.turno.select.titulo, true);
});

test("cambiarTurnoDeInscripcion mueve la misma inscripcion al turno nuevo", async () => {
  const { cliente, consultas } = clienteDePrueba({ id: 9 });

  await cambiarTurnoDeInscripcion(9, 2, cliente);

  const [[metodo, argumentos]] = consultas;
  assert.equal(metodo, "inscripcion.update");
  assert.deepEqual(argumentos.where, { id: 9 });
  assert.deepEqual(argumentos.data, { turnoId: 2 });
  assert.equal(argumentos.select.turno.select.inicio, true);
});

