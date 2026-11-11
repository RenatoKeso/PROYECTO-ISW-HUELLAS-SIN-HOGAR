import { api } from "./api.js";
import {
  validarRespuestaHistorialIngresos,
  validarRespuestaHistorialIngresosGlobal,
} from "../validations/ingresoValidation.js";

function crearFormData(datos) {
  const formData = new FormData();

  for (const [clave, valor] of Object.entries(datos)) {
    if (valor === undefined || valor === null || valor === "") continue;
    formData.append(clave, valor);
  }

  return formData;
}

function agregarImagen(formData, archivo) {
  formData.append("imagen", archivo);
  return formData;
}

export function crearFicha(datos) {
  return api.post("/fichas", datos);
}

export function crearFichaConImagen(datos, archivo) {
  return api.postForm("/fichas", agregarImagen(crearFormData(datos), archivo));
}

export function registrarIngreso(datos) {
  return api.post("/animales/ingresos", datos);
}

export function listarFichas() {
  return api.get("/fichas");
}

export async function listarIngresosFicha(id) {
  const respuesta = await api.get(`/animales/${id}/ingresos`);
  return validarRespuestaHistorialIngresos(respuesta);
}

export async function listarIngresosGlobales({ codigo, nombre } = {}) {
  const params = new URLSearchParams();
  if (codigo?.trim()) params.set("codigo", codigo.trim());
  if (nombre?.trim()) params.set("nombre", nombre.trim());
  const consulta = params.toString();
  const respuesta = await api.get(
    `/animales/ingresos${consulta ? `?${consulta}` : ""}`,
  );
  return validarRespuestaHistorialIngresosGlobal(respuesta);
}

export function subirImagenFicha(id, archivo) {
  return api.postForm(`/fichas/${id}/imagen`, agregarImagen(new FormData(), archivo));
}

export function quitarImagenFicha(id) {
  return api.delete(`/fichas/${id}/imagen`);
}
