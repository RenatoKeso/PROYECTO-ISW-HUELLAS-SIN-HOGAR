import test from "node:test";
import assert from "node:assert/strict";

import {
  postularComoVoluntario,
  revisarPostulacionVoluntario,
  deshacerRevisionPostulacionVoluntario,
} from "../../src/services/postulacionVoluntarioService.js";


const DATOS = {
  nombre: "Camila Soto",
  rut: "18765432-7",
  email: "camila.soto@gmail.com",
  telefono: "933322211",
  diasDisponibles: ["LUNES", "VIERNES"],
  motivacion: "Estudio veterinaria",
  habilidades: ["APOYO_VETERINARIO"],
};


function postulacionEnRevision(cambios = {}) {
  return { id: 3, ...DATOS, estado: "EN_REVISION", ...cambios };
}

function falsas(cambios = {}) {
  const guardado = { postulaciones: [], voluntarios: [], revisiones: [], deshechas: [], borrados: [] };

  const dependencias = {
    buscarVoluntarioPorEmail: async () => null,
    buscarPostulacionVigente: async () => null,
    crearPostulacionVoluntario: async (data) => {
      guardado.postulaciones.push(data);
      return { id: 10, estado: "EN_REVISION", ...data };
    },
    buscarPostulacionVoluntarioPorId: async () => postulacionEnRevision(),
    crearVoluntario: async (data) => {
      guardado.voluntarios.push(data);
      return { id: 7, ...data };
    },
    marcarPostulacionRevisada: async (id, data) => {
      guardado.revisiones.push({ id, ...data });
      return 1;
    },
    buscarActividadVoluntario: async (id) => ({
      id,
      usuario: null,
      _count: { inscripcionesTurno: 0, ingresosRecibidos: 0, devolucionesRecibidas: 0, postulacionesRevisadas: 0 },
    }),
    volverARevision: async (id, estado) => {
      guardado.deshechas.push({ id, estado });
      return 1;
    },
    eliminarVoluntario: async (id) => {
      guardado.borrados.push(id);
      return { id };
    },
    ejecutarEnTransaccion: async (callback) => callback("cliente-falso"),
    ...cambios,
  };

  return { dependencias, guardado };
}

function conCodigo(codigo) {
  return (error) => {
    assert.equal(error.codigo, codigo);
    return true;
  };
}


test("guarda la postulación cuando la persona no es voluntaria ni tiene otra en revisión", async () => {
  const { dependencias, guardado } = falsas();

  const postulacion = await postularComoVoluntario(DATOS, dependencias);

  assert.equal(postulacion.estado, "EN_REVISION");
  assert.equal(guardado.postulaciones.length, 1);
  assert.equal(guardado.postulaciones[0].rut, "18765432-7");
});

test("no deja postular si el correo ya es de un voluntario", async () => {
  const { dependencias, guardado } = falsas({
    buscarVoluntarioPorEmail: async () => ({ id: 1, nombre: "Martina Concha" }),
  });

  await assert.rejects(postularComoVoluntario(DATOS, dependencias), conCodigo("YA_ES_VOLUNTARIO"));
  assert.equal(guardado.postulaciones.length, 0);
});

test("no deja postular si ya fue aceptada antes con el mismo RUT", async () => {
  const { dependencias } = falsas({
    buscarPostulacionVigente: async () => ({ id: 1, estado: "ACEPTADA" }),
  });

  await assert.rejects(postularComoVoluntario(DATOS, dependencias), conCodigo("YA_ES_VOLUNTARIO"));
});

test("no deja postular si ya tiene una postulación en revisión", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionVigente: async () => ({ id: 3, estado: "EN_REVISION" }),
  });

  await assert.rejects(
    postularComoVoluntario(DATOS, dependencias),
    conCodigo("POSTULACION_EN_REVISION"),
  );
  assert.equal(guardado.postulaciones.length, 0);
});

test("solo guarda la otra habilidad si marcó OTRA", async () => {
  const { dependencias, guardado } = falsas();

  await postularComoVoluntario({ ...DATOS, otraHabilidad: "Fotografia" }, dependencias);
  await postularComoVoluntario(
    { ...DATOS, habilidades: ["OTRA"], otraHabilidad: "Fotografia" },
    dependencias,
  );

  assert.equal(guardado.postulaciones[0].otraHabilidad, null);
  assert.equal(guardado.postulaciones[1].otraHabilidad, "Fotografia");
});


test("al aceptar crea el voluntario y lo une a la postulación", async () => {
  const { dependencias, guardado } = falsas();

  await revisarPostulacionVoluntario(
    { postulacionId: 3, decision: "ACEPTADA", revisadaPorId: 5 },
    dependencias,
  );

  assert.deepEqual(guardado.voluntarios, [
    { nombre: "Camila Soto", email: "camila.soto@gmail.com", telefono: "933322211" },
  ]);
  assert.equal(guardado.revisiones[0].estado, "ACEPTADA");
  assert.equal(guardado.revisiones[0].voluntarioId, 7);
  assert.equal(guardado.revisiones[0].revisadaPorId, 5);
});

test("al rechazar guarda el motivo y no crea voluntario", async () => {
  const { dependencias, guardado } = falsas();

  await revisarPostulacionVoluntario(
    { postulacionId: 3, decision: "RECHAZADA", motivoRechazo: "No hay cupos", revisadaPorId: 5 },
    dependencias,
  );

  assert.equal(guardado.voluntarios.length, 0);
  assert.equal(guardado.revisiones[0].estado, "RECHAZADA");
  assert.equal(guardado.revisiones[0].motivoRechazo, "No hay cupos");
});

test("no deja revisar una postulación que no existe", async () => {
  const { dependencias } = falsas({ buscarPostulacionVoluntarioPorId: async () => null });

  await assert.rejects(
    revisarPostulacionVoluntario(
      { postulacionId: 99, decision: "ACEPTADA", revisadaPorId: 5 },
      dependencias,
    ),
    conCodigo("POSTULACION_INEXISTENTE"),
  );
});

test("no deja revisar dos veces la misma postulación", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionVoluntarioPorId: async () => postulacionEnRevision({ estado: "RECHAZADA" }),
  });

  await assert.rejects(
    revisarPostulacionVoluntario(
      { postulacionId: 3, decision: "ACEPTADA", revisadaPorId: 5 },
      dependencias,
    ),
    conCodigo("POSTULACION_YA_REVISADA"),
  );
  assert.equal(guardado.voluntarios.length, 0);
});


test("deshacer una aceptada la vuelve a revisión y borra el voluntario creado", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionVoluntarioPorId: async () =>
      postulacionEnRevision({ estado: "ACEPTADA", voluntarioId: 7 }),
  });

  await deshacerRevisionPostulacionVoluntario(3, dependencias);

  assert.deepEqual(guardado.deshechas, [{ id: 3, estado: "ACEPTADA" }]);
  assert.deepEqual(guardado.borrados, [7]);
});

test("deshacer una rechazada la vuelve a revisión sin borrar a nadie", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionVoluntarioPorId: async () =>
      postulacionEnRevision({ estado: "RECHAZADA", voluntarioId: null }),
  });

  await deshacerRevisionPostulacionVoluntario(3, dependencias);

  assert.deepEqual(guardado.deshechas, [{ id: 3, estado: "RECHAZADA" }]);
  assert.equal(guardado.borrados.length, 0);
});

test("no deja deshacer si el voluntario ya tiene cuenta o turnos", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionVoluntarioPorId: async () =>
      postulacionEnRevision({ estado: "ACEPTADA", voluntarioId: 7 }),
    buscarActividadVoluntario: async () => ({
      id: 7,
      usuario: { id: 4 },
      _count: { inscripcionesTurno: 2, ingresosRecibidos: 0, devolucionesRecibidas: 0, postulacionesRevisadas: 0 },
    }),
  });

  await assert.rejects(
    deshacerRevisionPostulacionVoluntario(3, dependencias),
    conCodigo("VOLUNTARIO_CON_ACTIVIDAD"),
  );
  assert.equal(guardado.deshechas.length, 0);
  assert.equal(guardado.borrados.length, 0);
});

test("no deja deshacer una postulación que sigue en revisión", async () => {
  const { dependencias } = falsas();

  await assert.rejects(
    deshacerRevisionPostulacionVoluntario(3, dependencias),
    conCodigo("POSTULACION_SIN_REVISAR"),
  );
});
