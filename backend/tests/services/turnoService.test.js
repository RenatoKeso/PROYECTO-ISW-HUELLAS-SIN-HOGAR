import assert from "node:assert/strict";
import test from "node:test";
import {
  obtenerTurnosDisponibles,
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

  const resultado = await obtenerTurnosGestion(
    { listarTurnosParaGestion: async () => turnos },
    AHORA,
  );

  assert.deepEqual(
    resultado.map((turno) => [turno.id, turno.inscripcionAbierta]),
    [[1, true], [2, false], [3, false], [4, false], [5, false], [6, true]],
  );
  assert.deepEqual(
    resultado.map((turno) => turno.inscritos),
    [0, 5, 0, 0, 0, 3],
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