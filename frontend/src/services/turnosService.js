import { api } from "./api.js";

// Turnos publicados que todavia no comienzan (voluntarios y encargada).
export function listarTurnosDisponibles() {
  return api.get("/turnos");
}

// Turnos de la encargada. Con `semana` (la fecha de su lunes) trae solo esa
// semana, tambien las pasadas: es su historial. Sin semana trae todos.
export function listarTurnosGestion(semana) {
  const filtro = semana ? `?semana=${encodeURIComponent(semana)}` : "";
  return api.get(`/turnos/gestion${filtro}`);
}

// Calendario del voluntario: los turnos de la semana con su estado para el.
export function obtenerCalendario(semana) {
  return api.get(`/turnos/calendario?semana=${encodeURIComponent(semana)}`);
}

export function obtenerInscritosDeTurno(id) {
  return api.get(`/turnos/${id}/inscritos`);
}

export function publicarTurno(datos) {
  return api.post("/turnos", datos);
}

export function cancelarTurno(id, motivo) {
  return api.patch(`/turnos/${id}/cancelacion`, { motivo });
}
