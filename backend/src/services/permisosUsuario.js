export const ROLES_USUARIO = Object.freeze([
    "DIRECTORA",
    "ENCARGADA_VOLUNTARIADO",
    "ENCARGADA_ADOPCIONES",
    "VETERINARIA",
    "VOLUNTARIO",
]);

function esCuentaActiva(usuario) {
return (
    usuario?.activo === true &&
    ROLES_USUARIO.includes(usuario.rol)
    );
}

// La directora crea cualquier rol.
// La encargada de voluntariado solo crea voluntarios.
export function puedeCrearUsuario(actor, rolNuevo) {
    if (!esCuentaActiva(actor) ||!ROLES_USUARIO.includes(rolNuevo)){
    return false;
}

    return (actor.rol === "DIRECTORA" ||(actor.rol === "ENCARGADA_VOLUNTARIADO" &&rolNuevo === "VOLUNTARIO"));
}

// Solo la directora asigna roles a otras cuentas.
export function puedeCambiarRol(actor, usuarioDestino, rolNuevo) {
    return (
    esCuentaActiva(actor) &&
    actor.rol === "DIRECTORA" &&
    Number.isInteger(usuarioDestino?.id) &&
    usuarioDestino.id > 0 &&
    actor.id !== usuarioDestino.id &&
    ROLES_USUARIO.includes(rolNuevo)
    );
}

// Desactivar conserva la cuenta y su historial.
export function puedeDesactivarUsuario(actor, usuarioDestino) {
if (
    !esCuentaActiva(actor) ||
    !Number.isInteger(usuarioDestino?.id) ||
    usuarioDestino.id <= 0 ||
    actor.id === usuarioDestino.id ||
    !ROLES_USUARIO.includes(usuarioDestino.rol)
    ) {
    return false;
}

    return (actor.rol === "DIRECTORA" ||(actor.rol === "ENCARGADA_VOLUNTARIADO" &&usuarioDestino.rol === "VOLUNTARIO"));
}

// Permiso contemplado en tu requisito sanitario.
export function puedeConsultarAlertas(actor) {
    return esCuentaActiva(actor) && actor.rol === "VETERINARIA";
}