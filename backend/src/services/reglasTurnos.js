// Reglas puras del modulo de turnos.
//
// No consultan la base de datos: reciben turnos que el servicio ya leyo (con
// `inicio`, `termino`, `fechaLimiteInscripcion` y `cuposDisponibles`) y
// responden si se cumplen o no. Son las piezas de "Validar cupos, plazo y
// horario" del caso de uso.

export function hayCupos(turno) {
  return turno.cuposDisponibles > 0;
}

// Un turno ya comenzo desde el instante exacto de su inicio.
export function turnoYaComenzo(turno, ahora = new Date()) {
  return ahora.getTime() >= turno.inicio.getTime();
}

// El plazo de inscripcion vence despues del ultimo instante de la fecha limite.
export function plazoVencido(turno, ahora = new Date()) {
  return (
    ahora.getTime() > turno.fechaLimiteInscripcion.getTime()
  );
}

// Dos turnos se solapan si uno empieza antes de que el otro termine, y al
// reves. Si uno termina justo cuando empieza el otro no se solapan.
export function seSolapan(turnoA, turnoB) {
  return (
    turnoA.inicio.getTime() < turnoB.termino.getTime() &&
    turnoB.inicio.getTime() < turnoA.termino.getTime()
  );
}

// Devuelve el primer turno de `otros` que se solapa con `turno`, o null.
export function turnoSolapadoCon(turno, otros) {
  return otros.find((otro) => seSolapan(turno, otro)) ?? null;
}

// Por que un voluntario no puede tomar un turno. Cada motivo tiene su error en
// turnoErrors.js (errorDeDisponibilidad).
export const MOTIVO_NO_DISPONIBLE = Object.freeze({
  CANCELADO: "CANCELADO",
  YA_COMENZO: "YA_COMENZO",
  PLAZO_VENCIDO: "PLAZO_VENCIDO",
  YA_INSCRITO: "YA_INSCRITO",
  SIN_CUPOS: "SIN_CUPOS",
  SOLAPE: "SOLAPE",
});

// Revisa si el voluntario puede tomar el turno, sin tocar la base de datos ni
// tomar el cupo. `activas` son sus inscripciones activas, cada una con su turno.
// Las reglas van en el mismo orden en que se revisan al inscribirse, asi el
// calendario y la inscripcion responden siempre lo mismo.
// Devuelve { disponible: true } o { disponible: false, motivo, turnoSolapado? }.
export function evaluarDisponibilidad(turno, activas, ahora = new Date()) {
  if (turno.estado === "CANCELADO") {
    return { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.CANCELADO };
  }

  if (turnoYaComenzo(turno, ahora)) {
    return { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.YA_COMENZO };
  }

  if (plazoVencido(turno, ahora)) {
    return { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.PLAZO_VENCIDO };
  }

  if (activas.some((inscripcion) => inscripcion.turnoId === turno.id)) {
    return { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.YA_INSCRITO };
  }

  if (!hayCupos(turno)) {
    return { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.SIN_CUPOS };
  }

  const turnoSolapado = turnoSolapadoCon(turno, activas.map((inscripcion) => inscripcion.turno));

  if (turnoSolapado) {
    return { disponible: false, motivo: MOTIVO_NO_DISPONIBLE.SOLAPE, turnoSolapado };
  }

  return { disponible: true };
}
