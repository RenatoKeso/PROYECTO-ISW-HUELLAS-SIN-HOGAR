export const CODIGO_ERROR_ADOPCION = {
  ANIMAL_INEXISTENTE: "ANIMAL_INEXISTENTE",
  ANIMAL_NO_DISPONIBLE: "ANIMAL_NO_DISPONIBLE",
  POSTULACION_DUPLICADA: "POSTULACION_DUPLICADA",
  POSTULACION_INEXISTENTE: "POSTULACION_INEXISTENTE",
  POSTULACION_YA_RESUELTA: "POSTULACION_YA_RESUELTA",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_ADOPCION.ANIMAL_INEXISTENTE]: 404,
  [CODIGO_ERROR_ADOPCION.ANIMAL_NO_DISPONIBLE]: 409,
  [CODIGO_ERROR_ADOPCION.POSTULACION_DUPLICADA]: 409,
  [CODIGO_ERROR_ADOPCION.POSTULACION_INEXISTENTE]: 404,
  [CODIGO_ERROR_ADOPCION.POSTULACION_YA_RESUELTA]: 409,
};

// Error de una regla del modulo de adopcion. El manejador central lo
// convierte en una respuesta HTTP con su codigo.
export class AdopcionError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = "AdopcionError";
    this.codigo = codigo;
    this.estadoHttp = ESTADO_HTTP_POR_CODIGO[codigo] ?? 500;
  }
}

export function esErrorAdopcion(error) {
  return error instanceof AdopcionError;
}

export function animalInexistente(id) {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.ANIMAL_INEXISTENTE,
    `No existe el animal con id ${id}`,
  );
}

export function animalNoDisponible() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.ANIMAL_NO_DISPONIBLE,
    "Este animal no esta disponible para adopcion en este momento",
  );
}

export function postulacionDuplicada() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.POSTULACION_DUPLICADA,
    "Ya existe una postulacion abierta con este RUT para este animal",
  );
}

export function postulacionInexistente(id) {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.POSTULACION_INEXISTENTE,
    `No existe la postulacion con id ${id}`,
  );
}

export function postulacionYaResuelta() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.POSTULACION_YA_RESUELTA,
    "La postulacion ya fue resuelta y no puede cambiar de decision",
  );
}