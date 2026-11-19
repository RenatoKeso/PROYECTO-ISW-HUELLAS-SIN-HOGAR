import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelarTurno,
  obtenerTurnosDisponibles,
  obtenerInscritosDeTurno,
  obtenerTurnosGestion,
  publicarTurno,
} from "../../src/services/turnoService.js";
import { esErrorTurno } from "../../src/entities/turnoErrors.js";

// 3 de noviembre de 2026, 12:00 en Chile.
const AHORA = new Date("2026-11-03T15:00:00.000Z");
const ENCARGADA = { id: 7, rol: "ENCARGADA_VOLUNTARIADO", activo: true };

const datosValidos = {
  titulo: "Paseo de perros",
  descripcion: "Sacar a pasear a los perros del refugio",
  fecha: "2026-11-10",
  horaInicio: "09:00",
  horaTermino: "12:00",
  fechaLimiteInscripcion: "2026-11-09",
  cupoMaximo: 10,
};

// Dependencias de prueba: guardan lo que reciben y devuelven lo mismo con un id.
function dependenciasDePrueba() {
  const llamadas = { crear: [] };

  return {
    llamadas,
    dependencias: {
      crearTurno: async (data) => {
        llamadas.crear.push(data);
        return { id: 1, estado: "PUBLICADO", ...data };
      },
      listarTurnosParaGestion: async () => [],
      listarTurnosPublicados: async () => [],
    },
  };
}

async function debeRechazarFechas(datos, mensaje, ahora = AHORA) {
  const { dependencias, llamadas } = dependenciasDePrueba();

  await assert.rejects(
    publicarTurno(datos, ENCARGADA, dependencias, ahora),
    (error) => {
      assert.ok(esErrorTurno(error));
      assert.equal(error.codigo, "FECHAS_TURNO_INVALIDAS");
      assert.equal(error.estadoHttp, 400);
      assert.match(error.message, mensaje);
      return true;
    },
  );
  assert.equal(llamadas.crear.length, 0, "no debe guardar nada");
}

test("publicarTurno convierte la hora de Chile a instantes UTC", async () => {
  const { dependencias, llamadas } = dependenciasDePrueba();

  await publicarTurno(datosValidos, ENCARGADA, dependencias, AHORA);

  const [guardado] = llamadas.crear;
  assert.equal(guardado.inicio.toISOString(), "2026-11-10T12:00:00.000Z");
  assert.equal(guardado.termino.toISOString(), "2026-11-10T15:00:00.000Z");
});

test("el plazo de inscripcion vence al terminar ese dia en Chile", async () => {
  const { dependencias, llamadas } = dependenciasDePrueba();

  await publicarTurno(datosValidos, ENCARGADA, dependencias, AHORA);

  assert.equal(
    llamadas.crear[0].fechaLimiteInscripcion.toISOString(),
    "2026-11-10T02:59:59.999Z",
  );
});

test("publicarTurno deja todos los cupos libres y registra quien lo publico", async () => {
  const { dependencias, llamadas } = dependenciasDePrueba();

  const turno = await publicarTurno(datosValidos, ENCARGADA, dependencias, AHORA);

  const [guardado] = llamadas.crear;
  assert.equal(guardado.cupoMaximo, 10);
  assert.equal(guardado.cuposDisponibles, 10);
  assert.equal(guardado.publicadoPorId, 7);
  assert.equal(guardado.descripcion, "Sacar a pasear a los perros del refugio");
  assert.equal(turno.inscritos, 0);
  assert.equal(turno.inscripcionAbierta, true);
});

test("la descripcion se guarda como null si no se envia", async () => {
  const { dependencias, llamadas } = dependenciasDePrueba();
  const { descripcion, ...sinDescripcion } = datosValidos;

  await publicarTurno(sinDescripcion, ENCARGADA, dependencias, AHORA);

  assert.equal(llamadas.crear[0].descripcion, null);
});

test("el plazo puede ser el mismo dia del turno", async () => {
  const { dependencias } = dependenciasDePrueba();

  const turno = await publicarTurno(
    { ...datosValidos, fechaLimiteInscripcion: "2026-11-10" },
    ENCARGADA,
    dependencias,
    AHORA,
  );

  assert.equal(turno.fechaLimiteInscripcion.toISOString(), "2026-11-11T02:59:59.999Z");
});

test("rechaza un turno que termina antes o a la misma hora que empieza", async () => {
  const mensaje = /posterior a la hora de inicio/;

  await debeRechazarFechas({ ...datosValidos, horaTermino: "09:00" }, mensaje);
  await debeRechazarFechas({ ...datosValidos, horaTermino: "08:30" }, mensaje);
});

test("rechaza un turno que ya comenzo o es del pasado", async () => {
  const mensaje = /comenzar en el futuro/;
  const hoy = {
    ...datosValidos,
    fecha: "2026-11-03",
    horaInicio: "11:00",
    horaTermino: "13:00",
    fechaLimiteInscripcion: "2026-11-03",
  };

  await debeRechazarFechas(hoy, mensaje);
  await debeRechazarFechas(
    { ...datosValidos, fecha: "2026-10-01", fechaLimiteInscripcion: "2026-09-30" },
    mensaje,
  );
});

test("rechaza un plazo posterior al dia del turno", async () => {
  await debeRechazarFechas(
    { ...datosValidos, fechaLimiteInscripcion: "2026-11-11" },
    /no puede ser posterior al dia del turno/,
  );
});

test("rechaza un plazo que ya paso", async () => {
  await debeRechazarFechas(
    { ...datosValidos, fechaLimiteInscripcion: "2026-11-02" },
    /ya paso/,
  );
});

test("rechaza la hora que no existe por el cambio de horario", async () => {
  const septiembre = new Date("2026-09-01T15:00:00.000Z");

  await debeRechazarFechas(
    {
      ...datosValidos,
      fecha: "2026-09-06",
      horaInicio: "00:30",
      horaTermino: "02:00",
      fechaLimiteInscripcion: "2026-09-05",
    },
    /no existe en el horario de Chile/,
    septiembre,
  );
});

test("obtenerTurnosGestion marca si cada turno admite inscripciones", async () => {
  const base = {
    titulo: "Turno",
    descripcion: null,
    inicio: new Date("2026-11-10T12:00:00.000Z"),
    termino: new Date("2026-11-10T15:00:00.000Z"),
    fechaLimiteInscripcion: new Date("2026-11-10T02:59:59.999Z"),
    cupoMaximo: 5,
    cuposDisponibles: 5,
    estado: "PUBLICADO",
    publicadoPorId: 7,
  };
  const turnos = [
    { ...base, id: 1 },
    { ...base, id: 2, cuposDisponibles: 0 },
    { ...base, id: 3, fechaLimiteInscripcion: new Date("2026-11-02T02:59:59.999Z") },
    { ...base, id: 4, inicio: new Date("2026-11-01T12:00:00.000Z") },
    { ...base, id: 5, estado: "CANCELADO" },
    { ...base, id: 6, cuposDisponibles: 2 },
  ];

  const { semana, turnos: resultado } = await obtenerTurnosGestion(
    {},
    { listarTurnosParaGestion: async () => turnos },
    AHORA,
  );

  assert.equal(semana, null);
  assert.deepEqual(
    resultado.map((turno) => [turno.id, turno.inscripcionAbierta]),
    [[1, true], [2, false], [3, false], [4, false], [5, false], [6, true]],
  );
  assert.deepEqual(
    resultado.map((turno) => turno.inscritos),
    [0, 5, 0, 0, 0, 3],
  );
  assert.deepEqual(
    resultado.map((turno) => turno.yaComenzo),
    [false, false, false, true, false, false],
  );
});

test("obtenerTurnosDisponibles pide los turnos desde el instante actual", async () => {
  let recibido = null;

  const resultado = await obtenerTurnosDisponibles(
    {
      listarTurnosPublicados: async (ahora) => {
        recibido = ahora;
        return [
          {
            id: 1,
            titulo: "Turno",
            descripcion: null,
            inicio: new Date("2026-11-10T12:00:00.000Z"),
            termino: new Date("2026-11-10T15:00:00.000Z"),
            fechaLimiteInscripcion: new Date("2026-11-10T02:59:59.999Z"),
            cupoMaximo: 4,
            cuposDisponibles: 1,
            estado: "PUBLICADO",
            publicadoPorId: 7,
          },
        ];
      },
    },
    AHORA,
  );

  assert.equal(recibido, AHORA);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].inscritos, 3);
  assert.equal(resultado[0].inscripcionAbierta, true);
});

test("obtenerTurnosGestion con semana pide solo esa semana en hora de Chile", async () => {
  const pedidos = [];
  const turno = {
    id: 9,
    titulo: "Turno",
    inicio: new Date("2026-10-27T12:00:00.000Z"),
    termino: new Date("2026-10-27T14:00:00.000Z"),
    fechaLimiteInscripcion: new Date("2026-10-27T02:59:59.999Z"),
    cupoMaximo: 4,
    cuposDisponibles: 1,
    estado: "PUBLICADO",
  };

  const resultado = await obtenerTurnosGestion(
    { semana: "2026-10-26" },
    {
      listarTurnosEntre: async (inicio, fin) => {
        pedidos.push([inicio.toISOString(), fin.toISOString()]);
        return [turno];
      },
      listarTurnosParaGestion: async () => assert.fail("no debe pedir todos los turnos"),
    },
    AHORA,
  );

  assert.deepEqual(pedidos, [["2026-10-26T03:00:00.000Z", "2026-11-02T02:59:59.999Z"]]);
  assert.deepEqual(resultado.semana, { desde: "2026-10-26", hasta: "2026-11-01" });
  assert.equal(resultado.turnos[0].yaComenzo, true, "una semana pasada sirve de historial");
  assert.equal(resultado.turnos[0].inscritos, 3);
});

test("obtenerInscritosDeTurno entrega el turno y sus inscripciones", async () => {
  const turno = {
    id: 4,
    titulo: "Paseo de perros",
    inicio: new Date("2026-11-10T12:00:00.000Z"),
    termino: new Date("2026-11-10T14:00:00.000Z"),
    fechaLimiteInscripcion: new Date("2026-11-10T02:59:59.999Z"),
    cupoMaximo: 5,
    cuposDisponibles: 4,
    estado: "PUBLICADO",
  };
  const inscripciones = [
    { id: 1, estado: "ACTIVA", voluntario: { id: 3, nombre: "Camila Rojas" } },
    { id: 2, estado: "CANCELADA", voluntario: { id: 8, nombre: "Diego Soto" } },
  ];
  const pedidos = [];

  const resultado = await obtenerInscritosDeTurno(
    { id: 4 },
    {
      buscarTurnoPorId: async (id) => (id === 4 ? turno : null),
      listarInscripcionesDeTurno: async (id) => {
        pedidos.push(id);
        return inscripciones;
      },
    },
    AHORA,
  );

  assert.equal(resultado.turno.id, 4);
  assert.equal(resultado.turno.inscritos, 1);
  assert.deepEqual(resultado.inscripciones, inscripciones);
  assert.deepEqual(pedidos, [4]);
});

test("obtenerInscritosDeTurno responde turno inexistente si no existe", async () => {
  await assert.rejects(
    obtenerInscritosDeTurno(
      { id: 99 },
      {
        buscarTurnoPorId: async () => null,
        listarInscripcionesDeTurno: async () => assert.fail("no debe buscar inscripciones"),
      },
      AHORA,
    ),
    (error) => esErrorTurno(error) && error.codigo === "TURNO_INEXISTENTE" && error.estadoHttp === 404,
  );
});

// cancelarTurno

const QUIEN_CANCELA = { id: 2, rol: "ENCARGADA_VOLUNTARIADO" };

function turnoPorCancelar(extra = {}) {
  return {
    id: 8,
    titulo: "Jornada de adopcion",
    inicio: new Date("2026-11-10T12:00:00.000Z"),
    termino: new Date("2026-11-10T15:00:00.000Z"),
    fechaLimiteInscripcion: new Date("2026-11-10T02:59:59.999Z"),
    cupoMaximo: 5,
    cuposDisponibles: 3,
    estado: "PUBLICADO",
    ...extra,
  };
}

function dependenciasDeCancelacion({ turno = turnoPorCancelar(), cancela = true } = {}) {
  const pasos = [];
  const activas = [
    { id: 21, voluntario: { id: 3, nombre: "Camila Rojas", email: "camila@correo.cl" } },
    { id: 22, voluntario: { id: 4, nombre: "Diego Soto", email: "diego@correo.cl" } },
  ];
  let cancelado = false;

  return {
    pasos,
    activas,
    enTransaccion: async (fn) => {
      pasos.push("transaccion");
      return fn("tx");
    },
    buscarTurnoPorId: async (id, tx) => {
      pasos.push(tx ? "buscar-en-tx" : "buscar");
      if (!turno) return null;
      return cancelado
        ? { ...turno, estado: "CANCELADO", motivoCancelacion: "Lluvia", canceladoEn: AHORA }
        : turno;
    },
    cancelarTurnoEnBase: async (id, datos, tx) => {
      pasos.push(["cancelar-turno", id, datos, tx]);
      cancelado = cancela;
      return cancela;
    },
    listarInscripcionesActivasDeTurno: async (id, tx) => {
      pasos.push(["listar-activas", id, tx]);
      return activas;
    },
    cancelarInscripcionesDeTurno: async (id, fecha, tx) => {
      pasos.push(["cancelar-inscripciones", id, fecha, tx]);
      return activas.length;
    },
    registrarHistoriales: async (filas, tx) => {
      pasos.push(["historial", filas, tx]);
      return filas.length;
    },
  };
}

test("cancelarTurno cancela el turno, sus inscripciones y registra el historial en una transaccion", async () => {
  const dependencias = dependenciasDeCancelacion();

  const resultado = await cancelarTurno({ id: 8 }, { motivo: "Lluvia" }, QUIEN_CANCELA, dependencias, AHORA);

  const [, transaccion, cancelar, listar, inscripciones, historial] = dependencias.pasos;
  assert.equal(transaccion, "transaccion");
  assert.deepEqual(cancelar, ["cancelar-turno", 8, { motivo: "Lluvia", canceladoPorId: 2, canceladoEn: AHORA }, "tx"]);
  assert.deepEqual(listar, ["listar-activas", 8, "tx"]);
  assert.deepEqual(inscripciones, ["cancelar-inscripciones", 8, AHORA, "tx"]);
  assert.equal(historial[2], "tx");
  assert.deepEqual(historial[1], [
    { inscripcionId: 21, accion: "CANCELACION", turnoId: 8, detalle: "Turno cancelado por el refugio: Lluvia", realizadoPorId: 2 },
    { inscripcionId: 22, accion: "CANCELACION", turnoId: 8, detalle: "Turno cancelado por el refugio: Lluvia", realizadoPorId: 2 },
  ]);

  assert.equal(resultado.turno.estado, "CANCELADO");
  assert.equal(resultado.turno.motivoCancelacion, "Lluvia");
  assert.equal(resultado.turno.inscripcionAbierta, false);
  assert.deepEqual(resultado.inscripciones, dependencias.activas);
});

test("cancelarTurno responde turno inexistente si no existe", async () => {
  const dependencias = dependenciasDeCancelacion({ turno: null });

  await assert.rejects(
    cancelarTurno({ id: 99 }, { motivo: "Lluvia" }, QUIEN_CANCELA, dependencias, AHORA),
    (error) => esErrorTurno(error) && error.codigo === "TURNO_INEXISTENTE",
  );
  assert.ok(!dependencias.pasos.includes("transaccion"));
});

test("cancelarTurno no cancela un turno que ya estaba cancelado o que ya comenzo", async () => {
  const casos = [
    [turnoPorCancelar({ estado: "CANCELADO" }), "Este turno ya estaba cancelado"],
    [turnoPorCancelar({ inicio: new Date("2026-11-03T15:00:00.000Z") }), "Este turno ya comenzo y no se puede cancelar"],
  ];

  for (const [turno, mensaje] of casos) {
    const dependencias = dependenciasDeCancelacion({ turno });

    await assert.rejects(
      cancelarTurno({ id: 8 }, { motivo: "Lluvia" }, QUIEN_CANCELA, dependencias, AHORA),
      (error) => error.codigo === "TURNO_NO_CANCELABLE" && error.estadoHttp === 409 && error.message === mensaje,
    );
    assert.ok(!dependencias.pasos.includes("transaccion"), mensaje);
  }
});

test("si el turno cambio mientras se cancelaba, no toca las inscripciones", async () => {
  const dependencias = dependenciasDeCancelacion({ cancela: false });

  await assert.rejects(
    cancelarTurno({ id: 8 }, { motivo: "Lluvia" }, QUIEN_CANCELA, dependencias, AHORA),
    { codigo: "TURNO_NO_CANCELABLE", message: "El turno cambio mientras lo cancelabas, vuelve a cargarlo" },
  );
  const nombres = dependencias.pasos.map((paso) => (Array.isArray(paso) ? paso[0] : paso));
  assert.ok(!nombres.includes("cancelar-inscripciones"));
  assert.ok(!nombres.includes("historial"));
});
