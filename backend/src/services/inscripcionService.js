import { ejecutarEnTransaccion } from "../config/prisma.js";
import {
  bloquearVoluntario,
  buscarInscripcionPorId,
  crearInscripcion,
  listarHistorialDeInscripcion,
  listarInscripcionesActivasDeVoluntario,
  listarInscripcionesDeVoluntario,
  registrarHistorial,
  reservarCupo,
} from "../repositories/inscripcionRepository.js";
import { buscarTurnoPorId } from "../repositories/turnoRepository.js";
import {
  horarioSolapado,
  inscripcionDuplicada,
  inscripcionInexistente,
  plazoInscripcionVencido,
  turnoCancelado,
  turnoInexistente,
  turnoSinCupos,
  turnoYaComenzado,
  voluntarioNoVinculado,
} from "../entities/turnoErrors.js";
import {
  hayCupos,
  plazoVencido,
  turnoSolapadoCon,
  turnoYaComenzo,
} from "./reglasTurnos.js";

const DEPENDENCIAS_POR_DEFECTO = {
  enTransaccion: ejecutarEnTransaccion,
  bloquearVoluntario,
  buscarTurnoPorId,
  listarInscripcionesActivasDeVoluntario,
  reservarCupo,
  crearInscripcion,
  registrarHistorial,
  listarInscripcionesDeVoluntario,
  buscarInscripcionPorId,
  listarHistorialDeInscripcion,
};

// El voluntario sale de la cuenta con sesion, nunca del cuerpo de la peticion.
function voluntarioDe(usuario) {
  if (!Number.isInteger(usuario?.voluntarioId)) {
    throw voluntarioNoVinculado();
  }

  return usuario.voluntarioId;
}

// RF1. Capa 2 (reglas de negocio): todo ocurre en una transaccion para que la
// inscripcion, el cupo descontado y el historial se guarden juntos o no se guarde nada.
export async function inscribirseEnTurno(
  { turnoId },
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  ahora = new Date(),
) {
  const voluntarioId = voluntarioDe(usuario);

  return dependencias.enTransaccion(async (tx) => {
    await dependencias.bloquearVoluntario(voluntarioId, tx);

    const turno = await dependencias.buscarTurnoPorId(turnoId, tx);

    if (!turno) {
      throw turnoInexistente(turnoId);
    }

    if (turno.estado === "CANCELADO") {
      throw turnoCancelado();
    }

    if (turnoYaComenzo(turno, ahora)) {
      throw turnoYaComenzado();
    }

    if (plazoVencido(turno, ahora)) {
      throw plazoInscripcionVencido();
    }

    const activas = await dependencias.listarInscripcionesActivasDeVoluntario(voluntarioId, tx);

    if (activas.some((inscripcion) => inscripcion.turnoId === turno.id)) {
      throw inscripcionDuplicada();
    }

    if (!hayCupos(turno)) {
      throw turnoSinCupos();
    }

    if (turnoSolapadoCon(turno, activas.map((inscripcion) => inscripcion.turno))) {
      throw horarioSolapado();
    }

    // Si otra persona tomo el ultimo cupo entre la lectura y este punto, no queda cupo.
    if (!(await dependencias.reservarCupo(turno.id, tx))) {
      throw turnoSinCupos();
    }

    const inscripcion = await dependencias.crearInscripcion({ turnoId: turno.id, voluntarioId }, tx);

    await dependencias.registrarHistorial(
      {
        inscripcionId: inscripcion.id,
        accion: "INSCRIPCION",
        turnoId: turno.id,
        realizadoPorId: usuario.id,
      },
      tx,
    );

    return inscripcion;
  });
}

// RF15. Las inscripciones del voluntario con sesion, todas o solo las de un estado.
export async function obtenerMisInscripciones(
  { estado } = {},
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const voluntarioId = voluntarioDe(usuario);

  return dependencias.listarInscripcionesDeVoluntario(voluntarioId, estado);
}

// Busca una inscripcion del voluntario con sesion. Si no existe o es de otro
// voluntario responde lo mismo (404), para no revelar inscripciones ajenas.
export async function buscarInscripcionPropia(
  id,
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  cliente,
) {
  const voluntarioId = voluntarioDe(usuario);
  const inscripcion = await dependencias.buscarInscripcionPorId(id, cliente);

  if (!inscripcion || inscripcion.voluntarioId !== voluntarioId) {
    throw inscripcionInexistente(id);
  }

  return inscripcion;
}

// RF15. El historial de una inscripcion propia: inscripcion, cambios de turno y cancelacion.
export async function obtenerHistorialDeInscripcion(
  id,
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const inscripcion = await buscarInscripcionPropia(id, usuario, dependencias);
  const historial = await dependencias.listarHistorialDeInscripcion(inscripcion.id);

  return { inscripcion, historial };
}

