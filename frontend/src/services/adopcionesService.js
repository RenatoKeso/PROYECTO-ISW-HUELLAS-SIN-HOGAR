import { api, obtenerToken } from "./api.js";

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

export function registrarVisita(postulacionId, datos) {
  return api.post(`/adopciones/postulaciones/${postulacionId}/visitas`, datos);
}

export function omitirVisitaHogar(postulacionId, datos) {
  return api.post(`/adopciones/postulaciones/${postulacionId}/omision-visita`, datos);
}

export function formalizarEntrega(postulacionId, datos) {
  return api.post(`/adopciones/postulaciones/${postulacionId}/entrega`, datos);
}

export function marcarSeguimientoRealizado(postulacionId, seguimientoId) {
  return api.patch(
    `/adopciones/postulaciones/${postulacionId}/seguimientos/${seguimientoId}/realizado`,
    {},
  );
}

// "Luna Blanca" -> "acta-entrega-luna-blanca.pdf" (igual que en el backend).
// El archivo no lleva ningun id ni el codigo del animal.
function nombreArchivoActa(nombreAnimal) {
  const nombre = (nombreAnimal ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return nombre ? `acta-entrega-${nombre}.pdf` : "acta-entrega.pdf";
}

// El acta de entrega llega como archivo PDF y no como JSON, por eso no usa api.get.
// Se pide con el token (igual que el PDF del reporte de devoluciones) y se descarga.
export async function descargarActaEntrega(postulacionId, nombreAnimal) {
  const respuesta = await fetch(
    `${import.meta.env.VITE_API_URL}/adopciones/postulaciones/${postulacionId}/entrega/pdf`,
    { headers: { Authorization: `Bearer ${obtenerToken()}` } },
  );

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null);
    throw new Error(error?.message || "No se pudo descargar el acta de entrega");
  }

  const archivo = await respuesta.blob();
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivoActa(nombreAnimal);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera un poco despues: si se libera al tiro, algunos navegadores cancelan la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
