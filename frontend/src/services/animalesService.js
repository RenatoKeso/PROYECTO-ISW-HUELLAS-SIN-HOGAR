import { api } from "./api.js";

export function crearFicha(datos) {
  return api.post("/fichas", datos);
}

export function registrarIngreso(datos) {
  return api.post("/animales/ingresos", datos);
}
