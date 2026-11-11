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