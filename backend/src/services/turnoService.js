import {
  crearTurno,
  listarTurnosParaGestion,
  listarTurnosPublicados,
} from "../repositories/turnoRepository.js";
import { fechasTurnoInvalidas } from "../entities/turnoErrors.js";
import { finDelDiaEnChile, instanteEnChile } from "./horarioChile.js";
import { hayCupos, plazoVencido, turnoYaComenzo } from "./reglasTurnos.js";

const DEPENDENCIAS_POR_DEFECTO = {
  crearTurno,
  listarTurnosParaGestion,
  listarTurnosPublicados,
};

// Agrega al turno lo que la pantalla necesita para mostrarlo:
// cuantos voluntarios hay inscritos y si todavia se puede inscribir alguien.

function presentarTurno(turno, ahora) {
  const inscripcionAbierta =
    turno.estado === "PUBLICADO" &&
    hayCupos(turno) &&
    !plazoVencido(turno, ahora) &&
    !turnoYaComenzo(turno, ahora);

  return {
    ...turno,
    inscritos: turno.cupoMaximo - turno.cuposDisponibles,
    inscripcionAbierta,
  };
}

// Capa 2 (reglas de negocio): la encargada escribe fecha y hora de Chile y aqui
// se convierten a instantes UTC y se revisan las reglas que Zod no puede ver.

export async function publicarTurno(
  { titulo, descripcion, fecha, horaInicio, horaTermino, fechaLimiteInscripcion, cupoMaximo },
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const { crearTurno } = dependencias;

  const inicio = instanteEnChile(fecha, horaInicio);
  const termino = instanteEnChile(fecha, horaTermino);

  if (!inicio || !termino) {
    throw fechasTurnoInvalidas("La fecha o la hora del turno no existe en el horario de Chile");
  }

  if (termino.getTime() <= inicio.getTime()) {
    throw fechasTurnoInvalidas("La hora de termino debe ser posterior a la hora de inicio");
  }

  if (turnoYaComenzo({ inicio }, ahora)) {
    throw fechasTurnoInvalidas("El turno debe comenzar en el futuro");
  }

  // Las fechas "AAAA-MM-DD" se pueden comparar como texto.
  if (fechaLimiteInscripcion > fecha) {
    throw fechasTurnoInvalidas(
      "La fecha limite de inscripcion no puede ser posterior al dia del turno",
    );
  }

  const fechaLimite = finDelDiaEnChile(fechaLimiteInscripcion);

  if (!fechaLimite) {
    throw fechasTurnoInvalidas("La fecha limite de inscripcion no es valida");
  }

  if (plazoVencido({ fechaLimiteInscripcion: fechaLimite }, ahora)) {
    throw fechasTurnoInvalidas("La fecha limite de inscripcion ya paso");
  }

  const turno = await crearTurno({
    titulo,
    descripcion: descripcion ?? null,
    inicio,
    termino,
    fechaLimiteInscripcion: fechaLimite,
    cupoMaximo,
    cuposDisponibles: cupoMaximo,
    publicadoPorId: usuario.id,
  });

  return presentarTurno(turno, ahora);
}

export async function obtenerTurnosGestion(
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const turnos = await dependencias.listarTurnosParaGestion();

  return turnos.map((turno) => presentarTurno(turno, ahora));
}

export async function obtenerTurnosDisponibles(
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const turnos = await dependencias.listarTurnosPublicados(ahora);

  return turnos.map((turno) => presentarTurno(turno, ahora));
}