import { api } from "./api.js";

// ---------- Publicas ----------

export function listarAnimalesEnAdopcion() {
  return api.get("/adopciones/animales");
}

// El formulario de postulacion lo puede enviar cualquier persona, sin sesion.
export function enviarPostulacion(datos) {
  return api.post("/adopciones/postulaciones", datos, { sinSesion: true });
}

// ---------- Equipo de adopciones (requieren sesion) ----------

export function listarPostulaciones(estado) {
  const filtro = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return api.get(`/adopciones/postulaciones${filtro}`);
}

export function obtenerPostulacion(id) {
  return api.get(`/adopciones/postulaciones/${id}`);
}

export function resolverPostulacion(id, datos) {
  return api.patch(`/adopciones/postulaciones/${id}/resolucion`, datos);
}

export function listarAnimalesPublicables() {
  return api.get("/adopciones/animales/publicables");
}

export function publicarAnimal(id) {
  return api.patch(`/adopciones/animales/${id}/publicar`, {});
}

export function registrarVisita(postulacionId, datos) {
  return api.post(`/adopciones/postulaciones/${postulacionId}/visitas`, datos);
}

export function omitirVisitaHogar(postulacionId, datos) {
  return api.post(`/adopciones/postulaciones/${postulacionId}/omision-visita`, datos);
}

export function formalizarEntrega(postulacionId, datos) {
  return api.post(`/adopciones/postulaciones/${postulacionId}/entrega`, datos);
}