import { api } from "./api.js";

export function generarReporteDevoluciones(datos) {
  return api.post("/reportes/devoluciones", datos);
}

export function listarReportesDevoluciones() {
  return api.get("/reportes/devoluciones");
}