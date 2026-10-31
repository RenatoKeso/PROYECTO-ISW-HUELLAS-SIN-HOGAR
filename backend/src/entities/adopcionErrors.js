export const CODIGO_ERROR_ADOPCION = {
  ANIMAL_INEXISTENTE: "ANIMAL_INEXISTENTE",
  ANIMAL_NO_DISPONIBLE: "ANIMAL_NO_DISPONIBLE",
  POSTULACION_DUPLICADA: "POSTULACION_DUPLICADA",
  POSTULACION_INEXISTENTE: "POSTULACION_INEXISTENTE",
  POSTULACION_YA_RESUELTA: "POSTULACION_YA_RESUELTA",
  ANIMAL_NO_PUBLICABLE: "ANIMAL_NO_PUBLICABLE",
  POSTULACION_NO_APROBADA: "POSTULACION_NO_APROBADA",
  VISITA_YA_REGISTRADA: "VISITA_YA_REGISTRADA",
  PRIMERA_VISITA_PENDIENTE: "PRIMERA_VISITA_PENDIENTE",
  VISITA_HOGAR_YA_RESUELTA: "VISITA_HOGAR_YA_RESUELTA",
  ENTREGA_NO_PERMITIDA: "ENTREGA_NO_PERMITIDA",
  FECHA_INVALIDA: "FECHA_INVALIDA",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_ADOPCION.ANIMAL_INEXISTENTE]: 404,
  [CODIGO_ERROR_ADOPCION.ANIMAL_NO_DISPONIBLE]: 409,
  [CODIGO_ERROR_ADOPCION.POSTULACION_DUPLICADA]: 409,
  [CODIGO_ERROR_ADOPCION.POSTULACION_INEXISTENTE]: 404,
  [CODIGO_ERROR_ADOPCION.POSTULACION_YA_RESUELTA]: 409,
  [CODIGO_ERROR_ADOPCION.ANIMAL_NO_PUBLICABLE]: 409,
  [CODIGO_ERROR_ADOPCION.POSTULACION_NO_APROBADA]: 409,
  [CODIGO_ERROR_ADOPCION.VISITA_YA_REGISTRADA]: 409,
  [CODIGO_ERROR_ADOPCION.PRIMERA_VISITA_PENDIENTE]: 409,
  [CODIGO_ERROR_ADOPCION.VISITA_HOGAR_YA_RESUELTA]: 409,
  [CODIGO_ERROR_ADOPCION.ENTREGA_NO_PERMITIDA]: 409,
  [CODIGO_ERROR_ADOPCION.FECHA_INVALIDA]: 400,
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

export function animalNoPublicable(mensaje) {
  return new AdopcionError(CODIGO_ERROR_ADOPCION.ANIMAL_NO_PUBLICABLE, mensaje);
}

export function postulacionNoAprobada() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.POSTULACION_NO_APROBADA,
    "La postulacion debe estar aprobada para registrar visitas o la entrega",
  );
}

export function visitaYaRegistrada() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.VISITA_YA_REGISTRADA,
    "Esta visita ya fue registrada para la postulacion",
  );
}

export function primeraVisitaPendiente() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.PRIMERA_VISITA_PENDIENTE,
    "Primero debe registrarse una primera visita con resultado favorable",
  );
}

export function visitaHogarYaResuelta() {
  return new AdopcionError(
    CODIGO_ERROR_ADOPCION.VISITA_HOGAR_YA_RESUELTA,
    "La visita al hogar ya fue registrada u omitida",
  );
}

export function entregaNoPermitida(mensaje) {
  return new AdopcionError(CODIGO_ERROR_ADOPCION.ENTREGA_NO_PERMITIDA, mensaje);
}

export function fechaInvalida(mensaje) {
  return new AdopcionError(CODIGO_ERROR_ADOPCION.FECHA_INVALIDA, mensaje);
}