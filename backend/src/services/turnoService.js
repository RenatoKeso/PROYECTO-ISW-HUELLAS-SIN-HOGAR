import {
  buscarTurnoPorId,
  crearTurno,
  listarTurnosEntre,
  listarTurnosParaGestion,
  listarTurnosPublicados,
} from "../repositories/turnoRepository.js";
import { listarInscripcionesDeTurno } from "../repositories/inscripcionRepository.js";
import { fechasTurnoInvalidas, turnoInexistente } from "../entities/turnoErrors.js";
import { finDelDiaEnChile, instanteEnChile, rangoDeSemanaEnChile } from "./horarioChile.js";
import { hayCupos, plazoVencido, turnoYaComenzo } from "./reglasTurnos.js";

const DEPENDENCIAS_POR_DEFECTO = {
  buscarTurnoPorId,
  crearTurno,
  listarInscripcionesDeTurno,
  listarTurnosEntre,
  listarTurnosParaGestion,
  listarTurnosPublicados,
};

// Agrega al turno lo que la pantalla necesita para mostrarlo:
// cuantos voluntarios hay inscritos y si todavia se puede inscribir alguien.

export function presentarTurno(turno, ahora) {
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

// Vista de la encargada. Con `semana` (su lunes) entrega los turnos de esa semana
// en hora de Chile, tambien de semanas pasadas: ese es su historial. Sin semana
// entrega todos. Cada turno dice ademas si ya comenzo, para pintarlo gris.
export async function obtenerTurnosGestion(
  { semana } = {},
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  let rango = null;
  let turnos;

  if (semana) {
    rango = rangoDeSemanaEnChile(semana);

    if (!rango) {
      throw fechasTurnoInvalidas("La semana indicada no es valida");
    }

    turnos = await dependencias.listarTurnosEntre(rango.inicio, rango.fin);
  } else {
    turnos = await dependencias.listarTurnosParaGestion();
  }

  return {
    semana: rango ? { desde: rango.desde, hasta: rango.hasta } : null,
    turnos: turnos.map((turno) => ({
      ...presentarTurno(turno, ahora),
      yaComenzo: turnoYaComenzo(turno, ahora),
    })),
  };
}

// "Ver inscritos" de la encargada: el turno y sus inscripciones, activas y
// canceladas, con el contacto de cada voluntario. Si el turno no existe, 404.
export async function obtenerInscritosDeTurno(
  { id },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const turno = await dependencias.buscarTurnoPorId(id);

  if (!turno) {
    throw turnoInexistente(id);
  }

  const inscripciones = await dependencias.listarInscripcionesDeTurno(id);

  return { turno: presentarTurno(turno, ahora), inscripciones };
}

export async function obtenerTurnosDisponibles(
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const turnos = await dependencias.listarTurnosPublicados(ahora);

  return turnos.map((turno) => presentarTurno(turno, ahora));
}