import { api } from "./api.js";

export function listarPostulacionesEntregadas() {
  return api.get("/devoluciones/postulaciones-entregadas");
}

export function registrarDevolucion(datos) {
  return api.post("/devoluciones", datos);
}