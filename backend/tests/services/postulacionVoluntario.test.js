import test from "node:test";
import assert from "node:assert/strict";

import {
  postularComoVoluntario,
  revisarPostulacionVoluntario,
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
  const guardado = { postulaciones: [], voluntarios: [], revisiones: [] };

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