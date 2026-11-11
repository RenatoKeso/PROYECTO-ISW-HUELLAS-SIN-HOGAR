import { api } from "./api.js";

export function inscribirseEnTurno(turnoId) {
  return api.post("/inscripciones", { turnoId });
}

export function listarMisInscripciones(estado) {
  const filtro = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return api.get(`/inscripciones/mias${filtro}`);
}

export function obtenerHistorialInscripcion(id) {
  return api.get(`/inscripciones/${id}/historial`);
}

export function modificarInscripcion(id, turnoId) {
  return api.patch(`/inscripciones/${id}`, { turnoId });
}

export function cancelarInscripcion(id) {
  return api.patch(`/inscripciones/${id}/cancelacion`, {});
}
