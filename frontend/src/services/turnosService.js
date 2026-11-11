import { api } from "./api.js";

// Turnos publicados que todavia no comienzan (voluntarios y encargada).
export function listarTurnosDisponibles() {
  return api.get("/turnos");
}

// Todos los turnos, incluidos los pasados (solo quien gestiona turnos).
export function listarTurnosGestion() {
  return api.get("/turnos/gestion");
}

export function publicarTurno(datos) {
  return api.post("/turnos", datos);
}
