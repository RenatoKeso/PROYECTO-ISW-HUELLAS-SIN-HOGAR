import test from "node:test";
import assert from "node:assert/strict";

import {
  registrarPostulacion,
  obtenerDetallePostulacion,
  resolverPostulacion,
} from "../../src/services/adopcionService.js";
import { CODIGO_ERROR_ADOPCION } from "../../src/entities/adopcionErrors.js";

const DATOS_POSTULACION = {
  fichaAnimalId: 1,
  nombrePostulante: "Ana Soto",
  rutPostulante: "12345678-5",
  telefonoPostulante: "912345678",
  tipoVivienda: "CASA",
  disponibilidadTiempo: "Trabaja media jornada",
};

const GRETEL_DISPONIBLE = { id: 1, nombre: "Gretel", estadoEstadia: "ESPERA_ADOPCION" };

function postulacionEnRevision(cambios = {}) {
  return {
    id: 10,
    rutPostulante: "12345678-5",
    estado: "EN_REVISION",
    alertaMostradaEn: null,
    fichaAnimal: { id: 1, estadoEstadia: "ESPERA_ADOPCION" },
    ...cambios,
  };
}

function conCodigo(codigo) {
  return (error) => {
    assert.equal(error.codigo, codigo);
    return true;
  };
}

// ---------- registrarPostulacion ----------

test("registrarPostulacion guarda la postulacion si el animal esta publicado", async () => {
  let guardada;

  const resultado = await registrarPostulacion(DATOS_POSTULACION, {
    buscarAnimalPorId: async () => GRETEL_DISPONIBLE,
    buscarPostulacionAbierta: async () => null,
    crearPostulacion: async (datos) => {
      guardada = datos;
      return { id: 1, estado: "EN_REVISION" };
    },
  });

  assert.deepEqual(guardada, DATOS_POSTULACION);
  assert.equal(resultado.estado, "EN_REVISION");
});

test("registrarPostulacion rechaza un animal que no existe", async () => {
  await assert.rejects(
    registrarPostulacion(DATOS_POSTULACION, {
      buscarAnimalPorId: async () => null,
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_INEXISTENTE),
  );
});

test("registrarPostulacion rechaza un animal que no esta en el catalogo", async () => {
  await assert.rejects(
    registrarPostulacion(DATOS_POSTULACION, {
      buscarAnimalPorId: async () => ({ ...GRETEL_DISPONIBLE, estadoEstadia: "ADOPTADO" }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_NO_DISPONIBLE),
  );
});

test("registrarPostulacion rechaza una segunda postulacion abierta del mismo RUT", async () => {
  await assert.rejects(
    registrarPostulacion(DATOS_POSTULACION, {
      buscarAnimalPorId: async () => GRETEL_DISPONIBLE,
      buscarPostulacionAbierta: async () => ({ id: 3 }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_DUPLICADA),
  );
});

// ---------- obtenerDetallePostulacion ----------

test("el detalle avisa las devoluciones anteriores y guarda cuando se mostro la alerta", async () => {
  let alertaGuardada = null;

  const detalle = await obtenerDetallePostulacion(10, {
    buscarPostulacionPorId: async () => postulacionEnRevision(),
    listarDevolucionesDelPostulante: async () => [{ id: 1, motivo: "SALUD" }],
    registrarAlertaMostrada: async (id, fecha) => {
      alertaGuardada = { id, fecha };
    },
  });

  assert.equal(detalle.antecedentes.tieneDevoluciones, true);
  assert.equal(detalle.antecedentes.cantidad, 1);
  assert.equal(alertaGuardada.id, 10);
  assert.ok(detalle.postulacion.alertaMostradaEn instanceof Date);
});

test("el detalle no vuelve a guardar la alerta si ya se habia mostrado", async () => {
  const yaMostrada = new Date("2026-10-01T10:00:00Z");
  let llamadas = 0;

  const detalle = await obtenerDetallePostulacion(10, {
    buscarPostulacionPorId: async () => postulacionEnRevision({ alertaMostradaEn: yaMostrada }),
    listarDevolucionesDelPostulante: async () => [{ id: 1 }],
    registrarAlertaMostrada: async () => {
      llamadas += 1;
    },
  });

  assert.equal(llamadas, 0);
  assert.equal(detalle.postulacion.alertaMostradaEn, yaMostrada);
});

test("el detalle sin devoluciones no muestra alerta", async () => {
  const detalle = await obtenerDetallePostulacion(10, {
    buscarPostulacionPorId: async () => postulacionEnRevision(),
    listarDevolucionesDelPostulante: async () => [],
    registrarAlertaMostrada: async () => {
      throw new Error("No deberia guardar la alerta");
    },
  });

  assert.equal(detalle.antecedentes.tieneDevoluciones, false);
  assert.equal(detalle.postulacion.alertaMostradaEn, null);
});

test("el detalle de una postulacion inexistente responde POSTULACION_INEXISTENTE", async () => {
  await assert.rejects(
    obtenerDetallePostulacion(99, { buscarPostulacionPorId: async () => null }),
    conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_INEXISTENTE),
  );
});

// ---------- resolverPostulacion ----------

test("resolverPostulacion aprueba y registra al voluntario revisor", async () => {
  let cambiosGuardados;

  await resolverPostulacion(
    10,
    { decision: "APROBADA", observaciones: "Buen espacio" },
    { id: 1, voluntarioId: 6 },
    {
      buscarPostulacionPorId: async () => postulacionEnRevision(),
      resolverPostulacionEnRevision: async (id, cambios) => {
        cambiosGuardados = cambios;
        return 1;
      },
    },
  );

  assert.equal(cambiosGuardados.estado, "APROBADA");
  assert.equal(cambiosGuardados.revisorId, 6);
  assert.equal(cambiosGuardados.observaciones, "Buen espacio");
  assert.ok(cambiosGuardados.fechaResolucion instanceof Date);
});

test("resolverPostulacion deja el revisor vacio si la cuenta no tiene voluntario", async () => {
  let cambiosGuardados;

  await resolverPostulacion(
    10,
    { decision: "RECHAZADA" },
    { id: 1, voluntarioId: null },
    {
      buscarPostulacionPorId: async () => postulacionEnRevision(),
      resolverPostulacionEnRevision: async (id, cambios) => {
        cambiosGuardados = cambios;
        return 1;
      },
    },
  );

  assert.equal(cambiosGuardados.revisorId, null);
  assert.equal("observaciones" in cambiosGuardados, false);
});

test("resolverPostulacion no cambia una postulacion ya resuelta", async () => {
  await assert.rejects(
    resolverPostulacion(10, { decision: "APROBADA" }, { id: 1 }, {
      buscarPostulacionPorId: async () => postulacionEnRevision({ estado: "RECHAZADA" }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_YA_RESUELTA),
  );
});

test("resolverPostulacion no aprueba si el animal ya salio del catalogo", async () => {
  await assert.rejects(
    resolverPostulacion(10, { decision: "APROBADA" }, { id: 1 }, {
      buscarPostulacionPorId: async () =>
        postulacionEnRevision({ fichaAnimal: { id: 1, estadoEstadia: "ADOPTADO" } }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_NO_DISPONIBLE),
  );
});

test("resolverPostulacion detecta si otra persona la resolvio primero", async () => {
  await assert.rejects(
    resolverPostulacion(10, { decision: "APROBADA" }, { id: 1 }, {
      buscarPostulacionPorId: async () => postulacionEnRevision(),
      resolverPostulacionEnRevision: async () => 0,
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_YA_RESUELTA),
  );
});