export const ROLES_USUARIO = Object.freeze([
  "DIRECTORA",
  "ENCARGADA_VOLUNTARIADO",
  "ENCARGADA_ADOPCIONES",
  "VETERINARIA",
  "VOLUNTARIO",
  "VOLUNTARIO_CONFIANZA",
]);

function esCuentaActiva(usuario) {
  return (
    usuario?.activo === true &&
    ROLES_USUARIO.includes(usuario.rol)
  );
}

function tieneRol(usuario, roles) {
  return (
    esCuentaActiva(usuario) &&
    roles.includes(usuario.rol)
  );
}

// La directora puede crear cuentas de todos los roles.
// La encargada conserva la creación de voluntarios normales.
export function puedeCrearUsuario(actor, rolNuevo) {
  if (
    !esCuentaActiva(actor) ||
    !ROLES_USUARIO.includes(rolNuevo)
  ) {
    return false;
  }

  return (
    actor.rol === "DIRECTORA" ||
    (
      actor.rol === "ENCARGADA_VOLUNTARIADO" &&
      rolNuevo === "VOLUNTARIO"
    )
  );
}

// Solo la directora cambia el rol de otras cuentas.
export function puedeCambiarRol(
  actor,
  usuarioDestino,
  rolNuevo
) {
  return (
    esCuentaActiva(actor) &&
    actor.rol === "DIRECTORA" &&
    Number.isInteger(usuarioDestino?.id) &&
    usuarioDestino.id > 0 &&
    actor.id !== usuarioDestino.id &&
    ROLES_USUARIO.includes(rolNuevo)
  );
}

export function puedeDesactivarUsuario(
  actor,
  usuarioDestino
) {
  if (
    !esCuentaActiva(actor) ||
    !Number.isInteger(usuarioDestino?.id) ||
    usuarioDestino.id <= 0 ||
    actor.id === usuarioDestino.id ||
    !ROLES_USUARIO.includes(usuarioDestino.rol)
  ) {
    return false;
  }

  return (
    actor.rol === "DIRECTORA" ||
    (
      actor.rol === "ENCARGADA_VOLUNTARIADO" &&
      usuarioDestino.rol === "VOLUNTARIO"
    )
  );
}

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

export function puedeConsultarVoluntarios(usuario) {
  return (
    puedeGestionarFichas(usuario) ||
    puedeConsultarReportesDevolucion(usuario)
  );
}

export function puedeGestionarAdopciones(usuario) {
  return tieneRol(usuario, [
    "DIRECTORA",
    "ENCARGADA_ADOPCIONES",
  ]);
}