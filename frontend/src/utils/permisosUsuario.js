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

export const NOMBRES_ROL = {
  DIRECTORA: "Directora",
  ENCARGADA_VOLUNTARIADO: "Encargada de voluntariado",
  ENCARGADA_ADOPCIONES: "Encargada de adopciones",
  VETERINARIA: "Veterinaria",
  VOLUNTARIO: "Voluntario",
  VOLUNTARIO_CONFIANZA: "Voluntario de confianza",
};