import { api } from "./api.js";

export function enviarPostulacionVoluntario(datos) {
  return api.post("/postulaciones-voluntario", datos, { sinSesion: true });
}

export function listarPostulacionesVoluntario(estado) {
  const filtro = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return api.get(`/postulaciones-voluntario${filtro}`);
}

export function revisarPostulacionVoluntario(id, datos) {
  return api.patch(`/postulaciones-voluntario/${id}/revision`, datos);
}