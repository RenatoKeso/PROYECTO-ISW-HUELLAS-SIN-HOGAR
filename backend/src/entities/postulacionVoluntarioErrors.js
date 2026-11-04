import { AdopcionError } from "./adopcionErrors.js";

export class PostulacionVoluntarioError extends AdopcionError {
  constructor(codigo, mensaje, estadoHttp) {
    super(codigo, mensaje);
    this.name = "PostulacionVoluntarioError";
    this.estadoHttp = estadoHttp;
  }
}

export function yaEsVoluntario() {
  return new PostulacionVoluntarioError(
    "YA_ES_VOLUNTARIO",
    "Ya eres voluntario del refugio, no necesitas postular",
    409,
  );
}

export function postulacionEnRevision() {
  return new PostulacionVoluntarioError(
    "POSTULACION_EN_REVISION",
    "Ya tienes una postulación en revisión con ese RUT o correo",
    409,
  );
}

export function postulacionVoluntarioNoEncontrada(id) {
  return new PostulacionVoluntarioError(
    "POSTULACION_INEXISTENTE",
    `No existe la postulación con id ${id}`,
    404,
  );
}

export function postulacionYaRevisada() {
  return new PostulacionVoluntarioError(
    "POSTULACION_YA_REVISADA",
    "Esta postulación ya fue revisada",
    409,
  );
}
export function postulacionSinRevisar() {
  return new PostulacionVoluntarioError(
    "POSTULACION_SIN_REVISAR",
    "Esta postulación todavía no se revisa, no hay nada que deshacer",
    409,
  );
}

export function voluntarioConActividad() {
  return new PostulacionVoluntarioError(
    "VOLUNTARIO_CON_ACTIVIDAD",
    "No se puede deshacer: el voluntario ya tiene cuenta o actividad en el refugio",
    409,
  );
}
