export const CODIGO_ERROR_IMAGEN = {
  IMAGEN_AUSENTE: "IMAGEN_AUSENTE",
  FORMATO_IMAGEN_INVALIDO: "FORMATO_IMAGEN_INVALIDO",
  IMAGEN_DEMASIADO_GRANDE: "IMAGEN_DEMASIADO_GRANDE",
  FALLO_GUARDADO_IMAGEN: "FALLO_GUARDADO_IMAGEN",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_IMAGEN.IMAGEN_AUSENTE]: 400,
  [CODIGO_ERROR_IMAGEN.FORMATO_IMAGEN_INVALIDO]: 400,
  [CODIGO_ERROR_IMAGEN.IMAGEN_DEMASIADO_GRANDE]: 413,
  [CODIGO_ERROR_IMAGEN.FALLO_GUARDADO_IMAGEN]: 500,
};

export class ImagenAnimalError extends Error {
  constructor(codigo, mensaje, opcion = {}) {
    super(mensaje, { cause: opcion.cause });

    this.name = "ImagenAnimalError";
    this.codigo = codigo;
    this.estadoHttp = ESTADO_HTTP_POR_CODIGO[codigo] ?? 500;
    this.opcion = opcion;
  }
}

export function esErrorImagenAnimal(error) {
  return error instanceof ImagenAnimalError;
}

export function imagenAusente(
  mensaje = "Debes adjuntar una imagen del animal",
) {
  return new ImagenAnimalError(CODIGO_ERROR_IMAGEN.IMAGEN_AUSENTE, mensaje);
}

export function formatoImagenInvalido(
  mensaje = "Solo se permiten imagenes en formato JPG o PNG",
) {
  return new ImagenAnimalError(
    CODIGO_ERROR_IMAGEN.FORMATO_IMAGEN_INVALIDO,
    mensaje,
  );
}

export function imagenDemasiadoGrande(
  mensaje = "La imagen no puede superar los 5 MB",
) {
  return new ImagenAnimalError(
    CODIGO_ERROR_IMAGEN.IMAGEN_DEMASIADO_GRANDE,
    mensaje,
  );
}

export function falloGuardadoImagen(cause) {
  return new ImagenAnimalError(
    CODIGO_ERROR_IMAGEN.FALLO_GUARDADO_IMAGEN,
    "No se pudo guardar la imagen del animal",
    { cause },
  );
}
