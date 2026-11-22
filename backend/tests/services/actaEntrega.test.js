import test from "node:test";
import assert from "node:assert/strict";

import { nombreArchivoActa, obtenerActaEntrega } from "../../src/services/adopcionService.js";
import { crearActaEntregaPdf } from "../../src/services/pdfEntregaAdopcion.js";
import { CODIGO_ERROR_ADOPCION } from "../../src/entities/adopcionErrors.js";

const dia = (texto) => new Date(`${texto}T00:00:00.000Z`);

function conCodigo(codigo) {
  return (error) => {
    assert.equal(error.codigo, codigo);
    return true;
  };
}

// Una postulacion entregada, como la devuelve buscarPostulacionPorId.
function postulacionEntregada(cambios = {}) {
  return {
    id: 15,
    estado: "ENTREGADA",
    nombrePostulante: "Ana Soto",
    rutPostulante: "12345678-5",
    telefonoPostulante: "912345678",
    emailPostulante: "ana@correo.cl",
    tipoVivienda: "CASA",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    createdAt: new Date("2026-11-02T13:30:00.000Z"),
    fechaResolucion: new Date("2026-11-04T15:00:00.000Z"),
    revisor: { id: 1, nombre: "Carmen Rojas" },
    fechaEntrega: dia("2026-11-12"),
    documentacionEntregada: "Contrato de adopcion",
    fichaAnimal: { id: 3, codigoAnimal: "anim-003", nombre: "Luna", especie: "GATO" },
    visitas: [
      {
        tipo: "PRIMERA_VISITA",
        resultado: "FAVORABLE",
        fechaVisita: dia("2026-11-06"),
        registradaPor: { nombre: "Carmen Rojas" },
      },
    ],
    motivoOmisionVisitaHogar: "POSTULANTE_CONOCIDO",
    fechaOmisionVisitaHogar: new Date("2026-11-09T18:00:00.000Z"),
    omisionAutorizadaPor: { nombre: "Carmen Rojas" },
    seguimientos: [
      { diasDesdeEntrega: 15, fechaProgramada: dia("2026-11-27"), estado: "PENDIENTE" },
      { diasDesdeEntrega: 30, fechaProgramada: dia("2026-12-12"), estado: "PENDIENTE" },
    ],
    ...cambios,
  };
}

test("obtenerActaEntrega arma el PDF y lo nombra con el nombre del animal", async () => {
  let recibida;

  const resultado = await obtenerActaEntrega(15, {
    buscarPostulacionPorId: async () => postulacionEntregada(),
    crearActaEntregaPdf: async (postulacion) => {
      recibida = postulacion;
      return Buffer.from("%PDF");
    },
  });

  assert.equal(recibida.nombrePostulante, "Ana Soto");
  assert.equal(resultado.nombreArchivo, "acta-entrega-luna.pdf");
  assert.equal(resultado.pdf.toString(), "%PDF");
});

test("el nombre del archivo no lleva tildes, espacios, ids ni codigos", () => {
  assert.equal(nombreArchivoActa("Ñandú Pérez"), "acta-entrega-nandu-perez.pdf");
  assert.equal(nombreArchivoActa("  Luna  "), "acta-entrega-luna.pdf");
  assert.equal(nombreArchivoActa(null), "acta-entrega.pdf");
  assert.equal(nombreArchivoActa("!!!"), "acta-entrega.pdf");
});

test("obtenerActaEntrega no arma el acta si el animal todavia no se entrega", async () => {
  for (const estado of ["EN_REVISION", "APROBADA", "RECHAZADA", "CERRADA"]) {
    await assert.rejects(
      obtenerActaEntrega(15, {
        buscarPostulacionPorId: async () => postulacionEntregada({ estado }),
        crearActaEntregaPdf: async () => assert.fail("no deberia armar el PDF"),
      }),
      conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_NO_ENTREGADA),
      estado,
    );
  }
});

test("obtenerActaEntrega responde POSTULACION_INEXISTENTE si no existe", async () => {
  await assert.rejects(
    obtenerActaEntrega(99, { buscarPostulacionPorId: async () => null }),
    conCodigo(CODIGO_ERROR_ADOPCION.POSTULACION_INEXISTENTE),
  );
});

test("el acta es un PDF valido, con visita al hogar u omitida", async () => {
  const conOmision = await crearActaEntregaPdf(postulacionEntregada());
  const conVisita = await crearActaEntregaPdf(
    postulacionEntregada({
      motivoOmisionVisitaHogar: null,
      visitas: [
        ...postulacionEntregada().visitas,
        { tipo: "VISITA_HOGAR", resultado: "FAVORABLE", fechaVisita: dia("2026-11-09") },
      ],
    }),
  );

  for (const pdf of [conOmision, conVisita]) {
    assert.ok(Buffer.isBuffer(pdf));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  }
});

test("el acta se arma aunque una postulacion antigua no tenga los datos del hogar", async () => {
  const pdf = await crearActaEntregaPdf(
    postulacionEntregada({
      emailPostulante: null,
      tenenciaVivienda: null,
      permiteMascotasArriendo: null,
      revisor: null,
      seguimientos: [],
    }),
  );

  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
});
