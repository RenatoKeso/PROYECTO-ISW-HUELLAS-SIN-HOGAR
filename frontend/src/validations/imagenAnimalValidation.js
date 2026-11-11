import { z } from "zod";

export const TIPOS_IMAGEN = ["image/jpeg", "image/png"];
export const EXTENSIONES_IMAGEN = [".jpg", ".jpeg", ".png"];
export const LIMITE_IMAGEN_BYTES = 5 * 1024 * 1024;

function esArchivo(valor) {
  return (
    typeof valor === "object" &&
    valor !== null &&
    typeof valor.name === "string" &&
    typeof valor.size === "number" &&
    typeof valor.type === "string"
  );
}

export function validarArchivoImagen(archivo) {
  if (!archivo) return null;

  if (!esArchivo(archivo)) {
    return "Selecciona un archivo de imagen válido";
  }

  const nombre = archivo.name.toLowerCase();
  const extensionValida = EXTENSIONES_IMAGEN.some((extension) =>
    nombre.endsWith(extension),
  );

  if (!TIPOS_IMAGEN.includes(archivo.type) || !extensionValida) {
    return "Solo se permiten imágenes en formato JPG o PNG";
  }

  if (archivo.size > LIMITE_IMAGEN_BYTES) {
    return "La imagen no puede superar los 5 MB";
  }

  return null;
}

export const imagenOpcionalSchema = z.any().superRefine((valor, contexto) => {
  if (valor === null || valor === undefined) return;

  const mensaje = validarArchivoImagen(valor);

  if (mensaje) {
    contexto.addIssue({
      code: "custom",
      message: mensaje,
    });
  }
});
