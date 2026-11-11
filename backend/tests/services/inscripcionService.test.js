import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelarInscripcionEnTurno,
  inscribirseEnTurno,
  obtenerHistorialDeInscripcion,
  obtenerMisInscripciones,
} from "../../src/services/inscripcionService.js";
import { esErrorTurno } from "../../src/entities/turnoErrors.js";

// 3 de noviembre de 2026, 12:00 en Chile.
const AHORA = new Date("2026-11-03T15:00:00.000Z");
const VOLUNTARIO = { id: 20, rol: "VOLUNTARIO", activo: true, voluntarioId: 4 };

function turnoBase(cambios = {}) {
  return {
    id: 1,
    titulo: "Paseo de perros",
    estado: "PUBLICADO",
    inicio: new Date("2026-11-10T12:00:00.000Z"),
    termino: new Date("2026-11-10T15:00:00.000Z"),
    fechaLimiteInscripcion: new Date("2026-11-10T02:59:59.999Z"),
    cupoMaximo: 5,
    cuposDisponibles: 5,
    ...cambios,
  };
}

// Dependencias de prueba: devuelven lo que se les indica y anotan lo que se les pide.
function dependenciasDePrueba({ turno = turnoBase(), activas = [], cupoTomado = true } = {}) {
  const llamadas = { orden: [], inscripciones: [], historial: [], reservas: [], bloqueos: [] };
  const tx = { id: "tx" };

  return {
    llamadas,
    dependencias: {
      enTransaccion: async (accion) => {
        llamadas.orden.push("transaccion");
        return accion(tx);
      },
      bloquearVoluntario: async (id, cliente) => {
        assert.equal(cliente, tx, "debe usar la transaccion");
        llamadas.bloqueos.push(id);
      },
      buscarTurnoPorId: async (id, cliente) => {
        assert.equal(cliente, tx, "debe usar la transaccion");
        return turno && turno.id === id ? turno : null;
      },
      listarInscripcionesActivasDeVoluntario: async () => activas,
      reservarCupo: async (id) => {
        llamadas.reservas.push(id);
        return cupoTomado;
      },
      crearInscripcion: async (data) => {
        llamadas.inscripciones.push(data);
        return { id: 99, estado: "ACTIVA", ...data };
      },
      registrarHistorial: async (data) => {
        llamadas.historial.push(data);
      },
    },
  };
}

async function debeRechazar(datos, usuario, opciones, codigo, estadoHttp) {
  const { dependencias, llamadas } = dependenciasDePrueba(opciones);

  await assert.rejects(inscribirseEnTurno(datos, usuario, dependencias, AHORA), (error) => {
    assert.ok(esErrorTurno(error));
    assert.equal(error.codigo, codigo);
    assert.equal(error.estadoHttp, estadoHttp);
    return true;
  });
  assert.equal(llamadas.inscripciones.length, 0, "no debe crear la inscripcion");
  assert.equal(llamadas.historial.length, 0, "no debe escribir historial");
}

test("inscribe al voluntario de la sesion, descuenta el cupo y registra el historial", async () => {
  const { dependencias, llamadas } = dependenciasDePrueba();

  const inscripcion = await inscribirseEnTurno({ turnoId: 1 }, VOLUNTARIO, dependencias, AHORA);

  assert.equal(inscripcion.id, 99);
  assert.deepEqual(llamadas.bloqueos, [4]);
  assert.deepEqual(llamadas.reservas, [1]);
  assert.deepEqual(llamadas.inscripciones, [{ turnoId: 1, voluntarioId: 4 }]);
  assert.deepEqual(llamadas.historial, [
    { inscripcionId: 99, accion: "INSCRIPCION", turnoId: 1, realizadoPorId: 20 },
  ]);
});

test("una cuenta sin voluntario vinculado no se puede inscribir", async () => {
  await debeRechazar({ turnoId: 1 }, { ...VOLUNTARIO, voluntarioId: null }, {}, "VOLUNTARIO_NO_VINCULADO", 403);
});

test("un turno inexistente responde 404", async () => {
  await debeRechazar({ turnoId: 8 }, VOLUNTARIO, {}, "TURNO_INEXISTENTE", 404);
});

test("un turno cancelado no recibe inscripciones", async () => {
  await debeRechazar({ turnoId: 1 }, VOLUNTARIO, { turno: turnoBase({ estado: "CANCELADO" }) }, "TURNO_CANCELADO", 409);
});

test("un turno que ya comenzo no recibe inscripciones", async () => {
  const turno = turnoBase({ inicio: new Date("2026-11-03T14:00:00.000Z"), termino: new Date("2026-11-03T18:00:00.000Z") });

  await debeRechazar({ turnoId: 1 }, VOLUNTARIO, { turno }, "TURNO_YA_COMENZADO", 409);
});

test("con el plazo vencido no se puede inscribir", async () => {
  const turno = turnoBase({ fechaLimiteInscripcion: new Date("2026-11-03T14:59:59.000Z") });

  await debeRechazar({ turnoId: 1 }, VOLUNTARIO, { turno }, "PLAZO_INSCRIPCION_VENCIDO", 409);
});

test("el ultimo instante del plazo todavia permite inscribirse", async () => {
  const turno = turnoBase({ fechaLimiteInscripcion: AHORA });
  const { dependencias } = dependenciasDePrueba({ turno });

  const inscripcion = await inscribirseEnTurno({ turnoId: 1 }, VOLUNTARIO, dependencias, AHORA);

  assert.equal(inscripcion.id, 99);
});

test("no se puede inscribir dos veces en el mismo turno", async () => {
  const activas = [{ id: 7, turnoId: 1, turno: turnoBase() }];

  await debeRechazar({ turnoId: 1 }, VOLUNTARIO, { activas }, "INSCRIPCION_DUPLICADA", 409);
});

test("un turno sin cupos responde 409", async () => {
  const { dependencias, llamadas } = dependenciasDePrueba({ turno: turnoBase({ cuposDisponibles: 0 }) });

  await assert.rejects(inscribirseEnTurno({ turnoId: 1 }, VOLUNTARIO, dependencias, AHORA), (error) => {
    assert.equal(error.codigo, "TURNO_SIN_CUPOS");
    return true;
  });
  assert.equal(llamadas.reservas.length, 0);
});

test("si otra persona toma el ultimo cupo antes, responde sin cupos y no guarda nada", async () => {
  await debeRechazar({ turnoId: 1 }, VOLUNTARIO, { cupoTomado: false }, "TURNO_SIN_CUPOS", 409);
});

test("un horario que se solapa con otra inscripcion activa se rechaza", async () => {
  const otro = { id: 2, inicio: new Date("2026-11-10T14:00:00.000Z"), termino: new Date("2026-11-10T17:00:00.000Z") };

  await debeRechazar({ turnoId: 1 }, VOLUNTARIO, { activas: [{ id: 7, turnoId: 2, turno: otro }] }, "HORARIO_SOLAPADO", 409);
});

test("un turno que empieza justo cuando termina otro no se solapa", async () => {
  const otro = { id: 2, inicio: new Date("2026-11-10T09:00:00.000Z"), termino: new Date("2026-11-10T12:00:00.000Z") };
  const { dependencias } = dependenciasDePrueba({ activas: [{ id: 7, turnoId: 2, turno: otro }] });

  const inscripcion = await inscribirseEnTurno({ turnoId: 1 }, VOLUNTARIO, dependencias, AHORA);

  assert.equal(inscripcion.id, 99);
});

// Dependencias de prueba para las consultas (RF15).
function dependenciasDeConsulta({ inscripcion = null, historial = [] } = {}) {
  const llamadas = { listados: [], historial: [] };

  return {
    llamadas,
    dependencias: {
      listarInscripcionesDeVoluntario: async (voluntarioId, estado) => {
        llamadas.listados.push({ voluntarioId, estado });
        return [{ id: 1 }];
      },
      buscarInscripcionPorId: async (id) => (inscripcion && inscripcion.id === id ? inscripcion : null),
      listarHistorialDeInscripcion: async (id) => {
        llamadas.historial.push(id);
        return historial;
      },
    },
  };
}

test("obtenerMisInscripciones consulta solo las del voluntario de la sesion", async () => {
  const { dependencias, llamadas } = dependenciasDeConsulta();

  const todas = await obtenerMisInscripciones({}, VOLUNTARIO, dependencias);
  await obtenerMisInscripciones({ estado: "ACTIVA" }, VOLUNTARIO, dependencias);

  assert.deepEqual(todas, [{ id: 1 }]);
  assert.deepEqual(llamadas.listados, [
    { voluntarioId: 4, estado: undefined },
    { voluntarioId: 4, estado: "ACTIVA" },
  ]);
});

test("obtenerMisInscripciones exige una cuenta vinculada a un voluntario", async () => {
  const { dependencias } = dependenciasDeConsulta();

  await assert.rejects(
    obtenerMisInscripciones({}, { ...VOLUNTARIO, voluntarioId: undefined }, dependencias),
    (error) => error.codigo === "VOLUNTARIO_NO_VINCULADO",
  );
});

test("el historial devuelve la inscripcion propia con sus operaciones", async () => {
  const inscripcion = { id: 9, voluntarioId: 4, estado: "ACTIVA" };
  const historial = [{ id: 1, accion: "INSCRIPCION" }];
  const { dependencias, llamadas } = dependenciasDeConsulta({ inscripcion, historial });

  const resultado = await obtenerHistorialDeInscripcion(9, VOLUNTARIO, dependencias);

  assert.deepEqual(resultado, { inscripcion, historial });
  assert.deepEqual(llamadas.historial, [9]);
});

test("el historial de una inscripcion inexistente o ajena responde 404 sin revelar cual", async () => {
  const ajena = { id: 9, voluntarioId: 77, estado: "ACTIVA" };

  for (const opciones of [{}, { inscripcion: ajena }]) {
    const { dependencias, llamadas } = dependenciasDeConsulta(opciones);

    await assert.rejects(obtenerHistorialDeInscripcion(9, VOLUNTARIO, dependencias), (error) => {
      assert.equal(error.codigo, "INSCRIPCION_INEXISTENTE");
      assert.equal(error.estadoHttp, 404);
      return true;
    });
    assert.equal(llamadas.historial.length, 0);
  }
});

// Dependencias de prueba para cancelar (RF17).
function dependenciasDeCancelacion(inscripcion) {
  const llamadas = { liberados: [], canceladas: [], historial: [] };
  const tx = { id: "tx" };

  return {
    llamadas,
    dependencias: {
      enTransaccion: async (accion) => accion(tx),
      bloquearVoluntario: async () => {},
      buscarInscripcionPorId: async (id, cliente) => {
        assert.equal(cliente, tx, "debe leer dentro de la transaccion");
        return inscripcion && inscripcion.id === id ? inscripcion : null;
      },
      liberarCupo: async (turnoId) => {
        llamadas.liberados.push(turnoId);
      },
      cancelarInscripcion: async (id, canceladaEn) => {
        llamadas.canceladas.push({ id, canceladaEn });
        return { ...inscripcion, estado: "CANCELADA", canceladaEn };
      },
      registrarHistorial: async (data) => {
        llamadas.historial.push(data);
      },
    },
  };
}

function inscripcionActiva(cambios = {}) {
  return { id: 9, turnoId: 1, voluntarioId: 4, estado: "ACTIVA", turno: turnoBase(), ...cambios };
}

test("cancelar devuelve el cupo, marca la inscripcion y registra el historial", async () => {
  const { dependencias, llamadas } = dependenciasDeCancelacion(inscripcionActiva());

  const cancelada = await cancelarInscripcionEnTurno(9, VOLUNTARIO, dependencias, AHORA);

  assert.equal(cancelada.estado, "CANCELADA");
  assert.deepEqual(llamadas.liberados, [1]);
  assert.deepEqual(llamadas.canceladas, [{ id: 9, canceladaEn: AHORA }]);
  assert.deepEqual(llamadas.historial, [
    { inscripcionId: 9, accion: "CANCELACION", turnoId: 1, realizadoPorId: 20 },
  ]);
});

async function debeRechazarCancelacion(inscripcion, codigo, estadoHttp) {
  const { dependencias, llamadas } = dependenciasDeCancelacion(inscripcion);

  await assert.rejects(cancelarInscripcionEnTurno(9, VOLUNTARIO, dependencias, AHORA), (error) => {
    assert.equal(error.codigo, codigo);
    assert.equal(error.estadoHttp, estadoHttp);
    return true;
  });
  assert.equal(llamadas.liberados.length + llamadas.canceladas.length + llamadas.historial.length, 0);
}

test("no se puede cancelar una inscripcion inexistente o de otro voluntario", async () => {
  await debeRechazarCancelacion(null, "INSCRIPCION_INEXISTENTE", 404);
  await debeRechazarCancelacion(inscripcionActiva({ voluntarioId: 77 }), "INSCRIPCION_INEXISTENTE", 404);
});

test("una inscripcion ya cancelada no se cancela de nuevo", async () => {
  await debeRechazarCancelacion(inscripcionActiva({ estado: "CANCELADA" }), "INSCRIPCION_NO_ACTIVA", 409);
});

test("no se puede cancelar si el turno ya comenzo", async () => {
  const turno = turnoBase({ inicio: new Date("2026-11-03T14:00:00.000Z"), termino: new Date("2026-11-03T18:00:00.000Z") });

  await debeRechazarCancelacion(inscripcionActiva({ turno }), "TURNO_YA_COMENZADO", 409);
});

