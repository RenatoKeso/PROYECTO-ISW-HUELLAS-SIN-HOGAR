import { listarTurnosEntre } from "../repositories/turnoRepository.js";
import { listarInscripcionesDeVoluntario } from "../repositories/inscripcionRepository.js";
import { errorDeDisponibilidad, fechasTurnoInvalidas } from "../entities/turnoErrors.js";
import { rangoDeSemanaEnChile } from "./horarioChile.js";
import { voluntarioDe } from "./inscripcionService.js";
import { evaluarDisponibilidad, turnoYaComenzo } from "./reglasTurnos.js";
import { presentarTurno } from "./turnoService.js";

// Como se pinta cada turno en el calendario del voluntario.
export const ESTADO_EN_CALENDARIO = Object.freeze({
  INSCRITO: "INSCRITO",
  DISPONIBLE: "DISPONIBLE",
  NO_DISPONIBLE: "NO_DISPONIBLE",
  PASADO: "PASADO",
  CANCELADO: "CANCELADO",
});

const DEPENDENCIAS_POR_DEFECTO = {
  listarTurnosEntre,
  listarInscripcionesDeVoluntario,
};

// Estado de un turno para este voluntario. `activa` es su inscripcion activa en
// ese turno (o null) y `activas`, todas sus inscripciones activas.
function disponibilidadDe(turno, activa, activas, ahora) {
  if (turno.estado === "CANCELADO") {
    return { estado: ESTADO_EN_CALENDARIO.CANCELADO };
  }

  if (turnoYaComenzo(turno, ahora)) {
    return { estado: ESTADO_EN_CALENDARIO.PASADO };
  }

  if (activa) {
    return { estado: ESTADO_EN_CALENDARIO.INSCRITO };
  }

  // Las mismas reglas que la inscripcion: el rojo nunca contradice lo que pasaria
  // al intentar inscribirse.
  const evaluacion = evaluarDisponibilidad(turno, activas, ahora);

  if (evaluacion.disponible) {
    return { estado: ESTADO_EN_CALENDARIO.DISPONIBLE };
  }

  const solapado = evaluacion.turnoSolapado;

  return {
    estado: ESTADO_EN_CALENDARIO.NO_DISPONIBLE,
    motivo: evaluacion.motivo,
    mensaje: errorDeDisponibilidad(evaluacion.motivo).message,
    turnoSolapado: solapado
      ? { id: solapado.id, titulo: solapado.titulo, inicio: solapado.inicio, termino: solapado.termino }
      : null,
  };
}

// Los turnos de una semana (lunes a domingo, hora de Chile) con el estado de
// cada uno para el voluntario con sesion. Sirve tambien para semanas pasadas:
// asi el voluntario revisa los turnos en que estuvo o que cancelo (RF15).
export async function obtenerCalendarioVoluntario(
  { semana },
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const voluntarioId = voluntarioDe(usuario);
  const rango = rangoDeSemanaEnChile(semana);

  if (!rango) {
    throw fechasTurnoInvalidas("La semana indicada no es valida");
  }

  // Sus inscripciones se piden todas, no solo las de esta semana: un turno puede
  // chocar con otro que empezo la noche anterior.
  const [turnos, inscripciones] = await Promise.all([
    dependencias.listarTurnosEntre(rango.inicio, rango.fin),
    dependencias.listarInscripcionesDeVoluntario(voluntarioId),
  ]);

  const activas = inscripciones.filter((inscripcion) => inscripcion.estado === "ACTIVA");

  return {
    semana: { desde: rango.desde, hasta: rango.hasta },
    turnos: turnos.map((turno) => {
      const activa = activas.find((inscripcion) => inscripcion.turnoId === turno.id) ?? null;
      // Si no tiene una activa, puede tener una que cancelo (la mas reciente va primero).
      const propia =
        activa ??
        inscripciones.find((inscripcion) => inscripcion.turnoId === turno.id) ??
        null;

      return {
        ...presentarTurno(turno, ahora),
        disponibilidad: disponibilidadDe(turno, activa, activas, ahora),
        miInscripcion: propia ? { id: propia.id, estado: propia.estado } : null,
      };
    }),
  };
}
