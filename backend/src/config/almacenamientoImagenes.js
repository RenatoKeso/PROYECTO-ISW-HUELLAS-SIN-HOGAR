import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ_BACKEND = fileURLToPath(new URL("../../", import.meta.url));

export const CARPETA_UPLOADS = path.join(RAIZ_BACKEND, "uploads");
export const CARPETA_IMAGENES_ANIMALES = path.join(
  CARPETA_UPLOADS,
  "animales",
);
export const URL_IMAGENES_ANIMALES = "/uploads/animales";
export const LIMITE_IMAGEN_BYTES = 5 * 1024 * 1024;

export const TIPOS_IMAGEN_PERMITIDOS = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
]);

export function esExtensionImagenPermitida(mimetype, nombreArchivo) {
  const extension = path.extname(nombreArchivo ?? "").toLowerCase();
  const extensiones = TIPOS_IMAGEN_PERMITIDOS.get(mimetype);

  return Boolean(extensiones?.includes(extension));
}

export function rutaImagenAnimal(nombre) {
  return path.join(CARPETA_IMAGENES_ANIMALES, nombre);
}

export function urlImagenAnimal(nombre) {
  return `${URL_IMAGENES_ANIMALES}/${nombre}`;
}

export function rutaImagenDesdeUrl(imagenUrl) {
  return rutaImagenAnimal(path.basename(imagenUrl));
}
