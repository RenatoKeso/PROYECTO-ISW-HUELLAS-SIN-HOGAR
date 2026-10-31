const tieneRol = (usuario, roles) =>
    Boolean(usuario && roles.includes(usuario.rol));

export function puedeGestionarFichas(usuario) {
    return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_VOLUNTARIADO",
    "VOLUNTARIO",
]);
}

export function puedeConsultarAlertas(usuario) {
    return tieneRol(usuario, ["DIRECTORA", "VETERINARIA"]);
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
};