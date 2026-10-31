import test from "node:test";
import assert from "node:assert/strict";

import {
  publicarAnimal,
  registrarVisita,
  omitirVisitaHogar,
  formalizarEntrega,
} from "../../src/services/adopcionService.js";
import { CODIGO_ERROR_ADOPCION } from "../../src/entities/adopcionErrors.js";

const USUARIO = { id: 7, rol: "ENCARGADA_ADOPCIONES" };
const dia = (texto) => new Date(`${texto}T00:00:00.000Z`);

function conCodigo(codigo) {
  return (error) => {
    assert.equal(error.codigo, codigo);
    return true;
  };
}

function visita(tipo, resultado = "FAVORABLE", fecha = "2026-10-20") {
  return { id: tipo === "PRIMERA_VISITA" ? 1 : 2, tipo, resultado, fechaVisita: dia(fecha) };
}

function postulacionAprobada(cambios = {}) {
  return {
    id: 10,
    fichaAnimalId: 3,
    estado: "APROBADA",
    fechaResolucion: new Date("2026-10-15T15:00:00.000Z"),
    motivoOmisionVisitaHogar: null,
    visitas: [],
    fichaAnimal: { id: 3, estadoEstadia: "ESPERA_ADOPCION" },
    ...cambios,
  };
}

// ---------- publicarAnimal ----------

test("publicarAnimal publica un animal activo y adoptable", async () => {
  let publicado;

  const animal = await publicarAnimal(3, {
    buscarAnimalParaPublicar: async () => ({ id: 3, estadoEstadia: "ACTIVO", estadoAdopcion: "ADOPTABLE" }),
    publicarAnimalAdoptable: async (id) => {
      publicado = id;
      return 1;
    },
  });

  assert.equal(publicado, 3);
  assert.equal(animal.estadoEstadia, "ESPERA_ADOPCION");
});

test("publicarAnimal rechaza un animal que la veterinaria no marco como adoptable", async () => {
  await assert.rejects(
    publicarAnimal(3, {
      buscarAnimalParaPublicar: async () => ({ id: 3, estadoEstadia: "ACTIVO", estadoAdopcion: null }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_NO_PUBLICABLE),
  );
});

test("publicarAnimal rechaza un animal ya publicado o adoptado", async () => {
  for (const estadoEstadia of ["ESPERA_ADOPCION", "ADOPTADO"]) {
    await assert.rejects(
      publicarAnimal(3, {
        buscarAnimalParaPublicar: async () => ({ id: 3, estadoEstadia, estadoAdopcion: "ADOPTABLE" }),
      }),
      conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_NO_PUBLICABLE),
      estadoEstadia,
    );
  }
});

test("publicarAnimal responde ANIMAL_INEXISTENTE si no existe", async () => {
  await assert.rejects(
    publicarAnimal(99, { buscarAnimalParaPublicar: async () => null }),
    conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_INEXISTENTE),
  );
});

// ---------- registrarVisita ----------

test("registrarVisita guarda la primera visita con quien la registro", async () => {
  let guardada;

  await registrarVisita(
    10,
    { tipo: "PRIMERA_VISITA", fechaVisita: dia("2026-10-16"), resultado: "FAVORABLE" },
    USUARIO,
    {
      buscarPostulacionPorId: async () => postulacionAprobada(),
      crearVisita: async (datos) => {
        guardada = datos;
        return { id: 1, ...datos };
      },
    },
  );

  assert.equal(guardada.registradaPorId, 7);
  assert.equal(guardada.postulacionId, 10);
  assert.equal(guardada.observaciones, null);
});

test("registrarVisita exige una postulacion aprobada", async () => {
  await assert.rejects(
    registrarVisita(10, { tipo: "PRIMERA_VISITA", fechaVisita: dia("2026-10-16"), resultado: "FAVORABLE" }, USUARIO, {
      buscarPostulacionPorId: async () => postulacionAprobada({ estado: "EN_REVISION" }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_NO_APROBADA),
  );
});

test("registrarVisita no repite la primera visita", async () => {
  await assert.rejects(
    registrarVisita(10, { tipo: "PRIMERA_VISITA", fechaVisita: dia("2026-10-16"), resultado: "FAVORABLE" }, USUARIO, {
      buscarPostulacionPorId: async () => postulacionAprobada({ visitas: [visita("PRIMERA_VISITA")] }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.VISITA_YA_REGISTRADA),
  );
});

test("la visita al hogar exige una primera visita favorable", async () => {
  for (const visitas of [[], [visita("PRIMERA_VISITA", "DESFAVORABLE")]]) {
    await assert.rejects(
      registrarVisita(10, { tipo: "VISITA_HOGAR", fechaVisita: dia("2026-10-25"), resultado: "FAVORABLE" }, USUARIO, {
        buscarPostulacionPorId: async () => postulacionAprobada({ visitas }),
      }),
      conCodigo(CODIGO_ERROR_ADOPCION.PRIMERA_VISITA_PENDIENTE),
    );
  }
});

test("la visita al hogar no se registra si ya se omitio", async () => {
  await assert.rejects(
    registrarVisita(10, { tipo: "VISITA_HOGAR", fechaVisita: dia("2026-10-25"), resultado: "FAVORABLE" }, USUARIO, {
      buscarPostulacionPorId: async () =>
        postulacionAprobada({ visitas: [visita("PRIMERA_VISITA")], motivoOmisionVisitaHogar: "DISTANCIA" }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.VISITA_HOGAR_YA_RESUELTA),
  );
});

test("registrarVisita rechaza fechas anteriores a la aprobacion o a la primera visita", async () => {
  await assert.rejects(
    registrarVisita(10, { tipo: "PRIMERA_VISITA", fechaVisita: dia("2026-10-10"), resultado: "FAVORABLE" }, USUARIO, {
      buscarPostulacionPorId: async () => postulacionAprobada(),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.FECHA_INVALIDA),
  );

  await assert.rejects(
    registrarVisita(10, { tipo: "VISITA_HOGAR", fechaVisita: dia("2026-10-18"), resultado: "FAVORABLE" }, USUARIO, {
      buscarPostulacionPorId: async () => postulacionAprobada({ visitas: [visita("PRIMERA_VISITA", "FAVORABLE", "2026-10-20")] }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.FECHA_INVALIDA),
  );
});

// ---------- omitirVisitaHogar ----------

test("omitirVisitaHogar guarda el motivo y quien la autorizo", async () => {
  let guardado;

  await omitirVisitaHogar(10, { motivo: "DISTANCIA" }, USUARIO, {
    buscarPostulacionPorId: async () => postulacionAprobada({ visitas: [visita("PRIMERA_VISITA")] }),
    registrarOmisionVisitaHogar: async (id, datos) => {
      guardado = datos;
      return 1;
    },
  });

  assert.equal(guardado.motivoOmisionVisitaHogar, "DISTANCIA");
  assert.equal(guardado.omisionAutorizadaPorId, 7);
  assert.ok(guardado.fechaOmisionVisitaHogar instanceof Date);
});

test("omitirVisitaHogar no se permite si la visita al hogar ya se registro", async () => {
  await assert.rejects(
    omitirVisitaHogar(10, { motivo: "DISTANCIA" }, USUARIO, {
      buscarPostulacionPorId: async () =>
        postulacionAprobada({ visitas: [visita("PRIMERA_VISITA"), visita("VISITA_HOGAR")] }),
    }),
    conCodigo(CODIGO_ERROR_ADOPCION.VISITA_HOGAR_YA_RESUELTA),
  );
});

// ---------- formalizarEntrega ----------

function dependenciasEntrega(postulacion, registro = {}) {
  return {
    buscarPostulacionPorId: async () => postulacion,
    ejecutarEnTransaccion: async (operacion) => operacion("cliente-de-transaccion"),
    marcarPostulacionEntregada: async (id, datos, cliente) => {
      registro.entrega = { id, datos, cliente };
      return 1;
    },
    marcarAnimalAdoptado: async (fichaAnimalId) => {
      registro.animal = fichaAnimalId;
      return 1;
    },
    cerrarOtrasPostulacionesAbiertas: async (datos) => {
      registro.cerrar = datos;
      return 2;
    },
    crearSeguimientos: async (seguimientos) => {
      registro.seguimientos = seguimientos;
    },
  };
}

const LISTA_PARA_ENTREGAR = postulacionAprobada({
  visitas: [visita("PRIMERA_VISITA", "FAVORABLE", "2026-10-18"), visita("VISITA_HOGAR", "FAVORABLE", "2026-10-22")],
});

test("formalizarEntrega deja todo listo en una transaccion", async () => {
  const registro = {};

  const resultado = await formalizarEntrega(
    10,
    { fechaEntrega: dia("2026-10-25"), documentacionEntregada: "Contrato y carnet" },
    dependenciasEntrega(LISTA_PARA_ENTREGAR, registro),
  );

  assert.equal(registro.entrega.cliente, "cliente-de-transaccion");
  assert.equal(registro.entrega.datos.documentacionEntregada, "Contrato y carnet");
  assert.equal(registro.animal, 3);
  assert.equal(registro.cerrar.postulacionEntregadaId, 10);
  assert.equal(resultado.postulacionesCerradas, 2);
  assert.deepEqual(
    registro.seguimientos.map((s) => [s.diasDesdeEntrega, s.fechaProgramada.toISOString().slice(0, 10)]),
    [[15, "2026-11-09"], [30, "2026-11-24"]],
  );
});

test("formalizarEntrega acepta la visita al hogar omitida", async () => {
  const registro = {};

  await formalizarEntrega(
    10,
    { fechaEntrega: dia("2026-10-25"), documentacionEntregada: "Contrato" },
    dependenciasEntrega(
      postulacionAprobada({ visitas: [visita("PRIMERA_VISITA")], motivoOmisionVisitaHogar: "POSTULANTE_CONOCIDO" }),
      registro,
    ),
  );

  assert.equal(registro.animal, 3);
});

test("formalizarEntrega no avanza sin la primera visita", async () => {
  await assert.rejects(
    formalizarEntrega(10, { fechaEntrega: dia("2026-10-25"), documentacionEntregada: "x" }, dependenciasEntrega(postulacionAprobada())),
    conCodigo(CODIGO_ERROR_ADOPCION.ENTREGA_NO_PERMITIDA),
  );
});

test("formalizarEntrega no avanza sin resolver la visita al hogar", async () => {
  await assert.rejects(
    formalizarEntrega(
      10,
      { fechaEntrega: dia("2026-10-25"), documentacionEntregada: "x" },
      dependenciasEntrega(postulacionAprobada({ visitas: [visita("PRIMERA_VISITA")] })),
    ),
    conCodigo(CODIGO_ERROR_ADOPCION.ENTREGA_NO_PERMITIDA),
  );
});

test("formalizarEntrega solo acepta postulaciones aprobadas", async () => {
  for (const estado of ["EN_REVISION", "RECHAZADA", "ENTREGADA"]) {
    await assert.rejects(
      formalizarEntrega(10, { fechaEntrega: dia("2026-10-25"), documentacionEntregada: "x" }, dependenciasEntrega({ ...LISTA_PARA_ENTREGAR, estado })),
      conCodigo(CODIGO_ERROR_ADOPCION.ENTREGA_NO_PERMITIDA),
      estado,
    );
  }
});

test("formalizarEntrega rechaza una fecha anterior a las visitas", async () => {
  await assert.rejects(
    formalizarEntrega(10, { fechaEntrega: dia("2026-10-21"), documentacionEntregada: "x" }, dependenciasEntrega(LISTA_PARA_ENTREGAR)),
    conCodigo(CODIGO_ERROR_ADOPCION.FECHA_INVALIDA),
  );
});

test("si el animal ya no esta disponible, la transaccion se cancela", async () => {
  const dependencias = dependenciasEntrega(LISTA_PARA_ENTREGAR);
  dependencias.marcarAnimalAdoptado = async () => 0;

  await assert.rejects(
    formalizarEntrega(10, { fechaEntrega: dia("2026-10-25"), documentacionEntregada: "x" }, dependencias),
    conCodigo(CODIGO_ERROR_ADOPCION.ANIMAL_NO_DISPONIBLE),
  );
});