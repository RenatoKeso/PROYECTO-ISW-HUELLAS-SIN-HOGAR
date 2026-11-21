import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";

import { 
    generarReporteDevoluciones,
    obtenerReportesDevolucion,
    generarPdfReporte,
} from "../services/reporteDevolucionService.js";

export async function generarReporte(request, response) {
  
  const reporte = await generarReporteDevoluciones({
    ...request.body,
    generadoPorId: request.usuario.id,
  });

  return enviarRespuestaExitosa(response, {
    mensaje: "Reporte de devoluciones generado correctamente",
    estado: 201,
    datos: { reporte },
  });
}

export async function listarReportes(request, response) {
  const reportes = await obtenerReportesDevolucion();

  return enviarRespuestaExitosa(response, {
    mensaje: "¡Listo! Reportes de devoluciones obtenidos correctamente",
    datos: { reportes },
  });
}

export async function descargarPdf(request, response) {
  const id = Number(request.params.id);
  const pdf = await generarPdfReporte(id);

  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", `attachment; filename="reporte-devoluciones-${id}.pdf"`);
  return response.send(pdf);
}