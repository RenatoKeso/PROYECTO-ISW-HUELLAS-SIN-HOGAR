import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";

import { 
    generarReporteDevoluciones,
    obtenerReportesDevolucion,
} from "../services/reporteDevolucionService.js";

export async function generarReporte(request, response) {
  const reporte = await generarReporteDevoluciones(request.body);

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