import { api, obtenerToken } from "./api.js";

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

export function deshacerRevisionPostulacionVoluntario(id) {
  return api.patch(`/postulaciones-voluntario/${id}/deshacer`, {});
}

export async function verCurriculumPostulacion(id) {
  const pestana = window.open("", "_blank");

  const respuesta = await fetch(
    `${import.meta.env.VITE_API_URL}/postulaciones-voluntario/${id}/curriculum`,
    { headers: { Authorization: `Bearer ${obtenerToken()}` } },
  );

  if (!respuesta.ok) {
    pestana.close();
    throw new Error("No se pudo abrir el currículum");
  }

  const archivo = await respuesta.blob();
  pestana.location.href = URL.createObjectURL(archivo);
}