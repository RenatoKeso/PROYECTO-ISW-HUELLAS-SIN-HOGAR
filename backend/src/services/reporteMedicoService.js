import { rolInsuficiente } from "../entities/registroMedicoErrors.js";
import { puedeConsultarRegistroMedico } from "./permisosUsuario.js";
import { crearPdfReporteMedico } from "./pdfReporteMedico.js";
import {
  obtenerRegistroMedicoParaReporte,
} from "../repositories/registroMedicoRepository.js";

const DEPENDENCIAS_POR_DEFECTO = {
  obtenerRegistro: obtenerRegistroMedicoParaReporte,
  crearPdf: crearPdfReporteMedico,
  puedeConsultar: puedeConsultarRegistroMedico,
};

/**
 * Genera el PDF del reporte médico usando exactamente los registros que el
 * frontend tiene filtrados y ordenados, sin duplicar la lógica de filtros.
 * Cada registro se consulta con su expediente clínico completo.
 */
export async function generarReporteMedicoPdf(
  { ids = [], actor, titulo, descripcionesFiltros = [] } = {},
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!dependencias.puedeConsultar(actor)) {
    throw rolInsuficiente();
  }

  const encontrados = await Promise.all(
    ids.map((id) => dependencias.obtenerRegistro(id)),
  );
  const registros = encontrados.filter(Boolean);
  const generadoEn = new Date();

  const pdf = await dependencias.crearPdf({
    registros,
    generadoPor: actor,
    titulo,
    descripcionesFiltros,
    generadoEn,
  });

  return {
    pdf,
    nombreArchivo: `reporte-medico-${generadoEn.toISOString().slice(0, 10)}.pdf`,
    total: registros.length,
  };
}
