export const ROLES_USUARIO = Object.freeze([
  "DIRECTORA",
  "ENCARGADA_VOLUNTARIADO",
  "ENCARGADA_ADOPCIONES",
  "VETERINARIA",
  "VOLUNTARIO",
  "VOLUNTARIO_CONFIANZA",
]);

const tieneRol = (usuario, roles) =>
  Boolean(usuario && roles.includes(usuario.rol));

export function puedeGestionarFichas(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_VOLUNTARIADO",
    "VOLUNTARIO",
    "VOLUNTARIO_CONFIANZA",
  ]);
}

export function puedeConsultarAlertas(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "VETERINARIA",
  ]);
}

export function puedeConsultarReportesDevolucion(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_ADOPCIONES",
  ]);
}

export function puedeGestionarAdopciones(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_ADOPCIONES",
  ]);
}

export function puedeRegistrarDevoluciones(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_ADOPCIONES",
    "VOLUNTARIO_CONFIANZA",
  ]);
}

// Modulo de turnos y voluntariado. Espeja los permisos del backend.
export function puedeGestionarTurnos(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_VOLUNTARIADO",
  ]);
}

export function puedeGestionarInscripciones(usuario) {
  return tieneRol(usuario, [
    "VOLUNTARIO",
    "VOLUNTARIO_CONFIANZA",
  ]);
}

export function puedeConsultarTurnos(usuario) {
  return (
    puedeGestionarTurnos(usuario) ||
    puedeGestionarInscripciones(usuario)
  );
}

export const NOMBRES_ROL = {
  DIRECTORA: "Directora",
  ENCARGADA_VOLUNTARIADO: "Encargada de voluntariado",
  ENCARGADA_ADOPCIONES: "Encargada de adopciones",
  VETERINARIA: "Veterinaria",
  VOLUNTARIO: "Voluntario",
  VOLUNTARIO_CONFIANZA: "Voluntario de confianza",
};

export function puedeRevisarPostulacionesVoluntario(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_VOLUNTARIADO",
  ]);
}

export function puedeConsultarRegistroMedico(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "VETERINARIA",
    "VOLUNTARIO",
    "VOLUNTARIO_CONFIANZA",
  ]);
}

export function puedeRegistrarRevisionInicial(usuario) {
  return tieneRol(usuario, [
    "VOLUNTARIO",
    "VOLUNTARIO_CONFIANZA",
    "VETERINARIA",
  ]);
}

export function puedeActualizarRevisionInicial(usuario) {
  return tieneRol(usuario, [
    "VOLUNTARIO",
    "VOLUNTARIO_CONFIANZA",
    "VETERINARIA",
  ]);
}

export function puedeRealizarRevisionFinal(usuario) {
  return tieneRol(usuario, ["VETERINARIA"]);
}

export function puedeActualizarRegistroMedico(usuario) {
  return tieneRol(usuario, ["VETERINARIA"]);
}
