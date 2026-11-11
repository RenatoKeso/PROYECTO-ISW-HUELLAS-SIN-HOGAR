export const CODIGO_ERROR_TURNO = {
  TURNO_INEXISTENTE: "TURNO_INEXISTENTE",
  INSCRIPCION_INEXISTENTE: "INSCRIPCION_INEXISTENTE",
  VOLUNTARIO_NO_VINCULADO: "VOLUNTARIO_NO_VINCULADO",
  TURNO_CANCELADO: "TURNO_CANCELADO",
  TURNO_YA_COMENZADO: "TURNO_YA_COMENZADO",
  TURNO_SIN_CUPOS: "TURNO_SIN_CUPOS",
  PLAZO_INSCRIPCION_VENCIDO: "PLAZO_INSCRIPCION_VENCIDO",
  HORARIO_SOLAPADO: "HORARIO_SOLAPADO",
  INSCRIPCION_DUPLICADA: "INSCRIPCION_DUPLICADA",
  INSCRIPCION_NO_ACTIVA: "INSCRIPCION_NO_ACTIVA",
  MISMO_TURNO: "MISMO_TURNO",
  FECHAS_TURNO_INVALIDAS: "FECHAS_TURNO_INVALIDAS",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_TURNO.TURNO_INEXISTENTE]: 404,
  [CODIGO_ERROR_TURNO.INSCRIPCION_INEXISTENTE]: 404,
  [CODIGO_ERROR_TURNO.VOLUNTARIO_NO_VINCULADO]: 403,
  [CODIGO_ERROR_TURNO.TURNO_CANCELADO]: 409,
  [CODIGO_ERROR_TURNO.TURNO_YA_COMENZADO]: 409,
  [CODIGO_ERROR_TURNO.TURNO_SIN_CUPOS]: 409,
  [CODIGO_ERROR_TURNO.PLAZO_INSCRIPCION_VENCIDO]: 409,
  [CODIGO_ERROR_TURNO.HORARIO_SOLAPADO]: 409,
  [CODIGO_ERROR_TURNO.INSCRIPCION_DUPLICADA]: 409,
  [CODIGO_ERROR_TURNO.INSCRIPCION_NO_ACTIVA]: 409,
  [CODIGO_ERROR_TURNO.MISMO_TURNO]: 409,
  [CODIGO_ERROR_TURNO.FECHAS_TURNO_INVALIDAS]: 400,
};

// Error de una regla del modulo de turnos y voluntariado. El manejador central
// lo convierte en una respuesta HTTP con su codigo.
export class TurnoError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = "TurnoError";
    this.codigo = codigo;
    this.estadoHttp = ESTADO_HTTP_POR_CODIGO[codigo] ?? 500;
  }
}

export function esErrorTurno(error) {
  return error instanceof TurnoError;
}

export function turnoInexistente(id) {
  return new TurnoError(
    CODIGO_ERROR_TURNO.TURNO_INEXISTENTE,
    `No existe el turno con id ${id}`,
  );
}

// Tambien se usa cuando la inscripcion existe pero es de otro voluntario: asi
// no se revela que ese id pertenece a alguien mas.
export function inscripcionInexistente(id) {
  return new TurnoError(
    CODIGO_ERROR_TURNO.INSCRIPCION_INEXISTENTE,
    `No existe la inscripcion con id ${id}`,
  );
}

export function voluntarioNoVinculado() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.VOLUNTARIO_NO_VINCULADO,
    "Tu cuenta no esta vinculada a un voluntario, por lo que no puede inscribirse en turnos",
  );
}

export function turnoCancelado() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.TURNO_CANCELADO,
    "Este turno fue cancelado y ya no recibe inscripciones",
  );
}

export function turnoYaComenzado() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.TURNO_YA_COMENZADO,
    "Este turno ya comenzo",
  );
}

export function turnoSinCupos() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.TURNO_SIN_CUPOS,
    "Este turno no tiene cupos disponibles",
  );
}

export function plazoInscripcionVencido() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.PLAZO_INSCRIPCION_VENCIDO,
    "El plazo de inscripcion de este turno ya vencio",
  );
}

export function horarioSolapado() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.HORARIO_SOLAPADO,
    "El horario de este turno se solapa con otra inscripcion activa",
  );
}

export function inscripcionDuplicada() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.INSCRIPCION_DUPLICADA,
    "Ya tienes una inscripcion activa en este turno",
  );
}

export function inscripcionNoActiva() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.INSCRIPCION_NO_ACTIVA,
    "Esta inscripcion ya esta cancelada",
  );
}

export function mismoTurno() {
  return new TurnoError(
    CODIGO_ERROR_TURNO.MISMO_TURNO,
    "La inscripcion ya esta en ese turno",
  );
}

export function fechasTurnoInvalidas(detalle) {
  return new TurnoError(
    CODIGO_ERROR_TURNO.FECHAS_TURNO_INVALIDAS,
    detalle,
  );
}