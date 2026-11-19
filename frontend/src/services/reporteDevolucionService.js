import { api, obtenerToken } from "./api.js";

export function generarReporteDevoluciones(datos) {
  return api.post("/reportes/devoluciones", datos);
}

export function listarReportesDevoluciones() {
  return api.get("/reportes/devoluciones");
}
// Pide el PDF al backend (con el token) 
export async function descargarPdfReporte(id) {
  const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/reportes/devoluciones/${id}/pdf`, {
    headers: { Authorization: `Bearer ${obtenerToken()}` },
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo descargar el PDF");
  }

  const archivo = await respuesta.blob();
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `reporte-devoluciones-${id}.pdf`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}