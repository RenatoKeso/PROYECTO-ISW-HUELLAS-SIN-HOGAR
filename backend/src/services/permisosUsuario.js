function tieneRol(usuario, roles) {
    return esCuentaActiva(usuario) && roles.includes(usuario.rol);
}

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

export function puedeConsultarVoluntarios(usuario) {
    return (
    puedeGestionarFichas(usuario) ||
    puedeConsultarReportesDevolucion(usuario)
    );
}