import assert from "node:assert/strict";
import test from "node:test";
import {
  crearInscripcion,
  listarInscripcionesActivasDeVoluntario,
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
      turno: { updateMany: registrar("turno.updateMany") },
      inscripcionTurno: {
        findMany: registrar("inscripcion.findMany"),
        create: registrar("inscripcion.create"),
      },
      historialInscripcion: { create: registrar("historial.create") },
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
