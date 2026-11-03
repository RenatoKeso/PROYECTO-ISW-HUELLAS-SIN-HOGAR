import test from "node:test";
import assert from "node:assert/strict";

import { registrarDevolucion } from "../../src/services/devolucionService.js";

const dia = (texto) => new Date(`${texto}T00:00:00.000Z`);

// Datos que manda el formulario.
const DATOS = {
  postulacionId: 2,
  receptorId: 1,
  fechaDevolucion: dia("2026-10-25"),
  motivo: "COMPORTAMIENTO",
  detalle: "Mordió a un vecino",
};

// Postulación que sí se puede devolver: entregada y con el animal adoptado.
function postulacionEntregada(cambios = {}) {
  return {
    id: 2,
    estado: "ENTREGADA",
    fechaEntrega: dia("2026-10-20"),
    fichaAnimalId: 4,
    fichaAnimal: { nombre: "Triton", codigoAnimal: "anim-004", estadoEstadia: "ADOPTADO" },
    ...cambios,
  };
}

// Funciones falsas que reemplazan a la base de datos.
// "guardado" anota lo que el servicio intentó guardar.
function falsas(cambios = {}) {
  const guardado = { cerradas: [], activos: [], creadas: [] };

  const dependencias = {
    buscarPostulacionParaDevolucion: async () => postulacionEntregada(),
    buscarVoluntarioActivo: async (id) => ({ id, nombre: "Martina Concha" }),
    contarDevolucionesPorMotivo: async () => 0,
    cerrarPostulacionEntregada: async (id) => {
      guardado.cerradas.push(id);
      return 1;
    },
    marcarAnimalActivo: async (id) => {
      guardado.activos.push(id);
      return 1;
    },
    crearDevolucion: async (data) => {
      guardado.creadas.push(data);
      return { id: 50, ...data };
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

test("registra la devolución, cierra la postulación y el animal vuelve al refugio", async () => {
  const { dependencias, guardado } = falsas();

  const { devolucion, aviso } = await registrarDevolucion(DATOS, dependencias);

  assert.deepEqual(guardado.cerradas, [2]);
  assert.deepEqual(guardado.activos, [4]);
  assert.equal(guardado.creadas.length, 1);
  assert.equal(devolucion.fichaAnimalId, 4);
  assert.equal(devolucion.motivo, "COMPORTAMIENTO");
  assert.equal(aviso, null);
});

test("avisa cuando el animal ya fue devuelto antes por el mismo motivo", async () => {
  const { dependencias } = falsas({ contarDevolucionesPorMotivo: async () => 2 });

  const { aviso } = await registrarDevolucion(DATOS, dependencias);

  assert.equal(aviso, "Triton ya había sido devuelto 2 veces por este mismo motivo");
});

test("rechaza una postulación que no existe", async () => {
  const { dependencias, guardado } = falsas({ buscarPostulacionParaDevolucion: async () => null });

  await assert.rejects(registrarDevolucion(DATOS, dependencias), conCodigo("POSTULACION_INEXISTENTE"));
  assert.equal(guardado.creadas.length, 0);
});

test("rechaza una postulación que no está entregada", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionParaDevolucion: async () => postulacionEntregada({ estado: "APROBADA" }),
  });

  await assert.rejects(registrarDevolucion(DATOS, dependencias), conCodigo("DEVOLUCION_NO_PERMITIDA"));
  assert.equal(guardado.creadas.length, 0);
});

test("rechaza un animal que no está adoptado", async () => {
  const { dependencias, guardado } = falsas({
    buscarPostulacionParaDevolucion: async () =>
      postulacionEntregada({
        fichaAnimal: { nombre: "Triton", codigoAnimal: "anim-004", estadoEstadia: "ACTIVO" },
      }),
  });

  await assert.rejects(registrarDevolucion(DATOS, dependencias), conCodigo("DEVOLUCION_NO_PERMITIDA"));
  assert.equal(guardado.creadas.length, 0);
});

test("rechaza una fecha de devolución anterior a la entrega", async () => {
  const { dependencias, guardado } = falsas();
  const datos = { ...DATOS, fechaDevolucion: dia("2026-10-15") };

  await assert.rejects(registrarDevolucion(datos, dependencias), conCodigo("FECHA_INVALIDA"));
  assert.equal(guardado.creadas.length, 0);
});

test("rechaza si el voluntario que recibe no existe o está desactivado", async () => {
  const { dependencias, guardado } = falsas({ buscarVoluntarioActivo: async () => null });

  await assert.rejects(registrarDevolucion(DATOS, dependencias), conCodigo("RECEPTOR_INVALIDO"));
  assert.equal(guardado.creadas.length, 0);
});

test("no guarda la devolución si otra persona ya cerró la postulación", async () => {
  const { dependencias, guardado } = falsas({ cerrarPostulacionEntregada: async () => 0 });

  await assert.rejects(registrarDevolucion(DATOS, dependencias), conCodigo("DEVOLUCION_NO_PERMITIDA"));
  assert.equal(guardado.creadas.length, 0);
});