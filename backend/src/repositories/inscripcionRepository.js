import prisma from "../config/prisma.js";
import { CAMPOS_TURNO } from "./turnoRepository.js";

// Campos de la inscripcion que se devuelven a la pantalla, con su turno.
export const CAMPOS_INSCRIPCION = {
  id: true,
  turnoId: true,
  voluntarioId: true,
  estado: true,
  canceladaEn: true,
  createdAt: true,
  turno: { select: CAMPOS_TURNO },
};

// Bloquea la fila del voluntario hasta que termine la transaccion. Asi, dos
// inscripciones del mismo voluntario (doble clic, dos pestanas) se hacen una
// despues de la otra y las reglas de duplicado y solape se revisan con datos al dia.
export async function bloquearVoluntario(voluntarioId, cliente = prisma) {
  await cliente.$queryRaw`SELECT id FROM "Voluntario" WHERE id = ${voluntarioId} FOR UPDATE`;
}

// Inscripciones activas del voluntario con el horario de su turno.
export async function listarInscripcionesActivasDeVoluntario(voluntarioId, cliente = prisma) {
  return cliente.inscripcionTurno.findMany({
    where: { voluntarioId, estado: "ACTIVA" },
    select: {
      id: true,
      turnoId: true,
      turno: { select: { id: true, inicio: true, termino: true } },
    },
  });
}

// Descuenta un cupo solo si el turno sigue publicado y le quedan cupos. La condicion
// va dentro de la misma consulta, asi dos inscripciones al mismo tiempo no pueden
// pasar de cero. Devuelve true si logro tomar el cupo.
export async function reservarCupo(turnoId, cliente = prisma) {
  const { count } = await cliente.turno.updateMany({
    where: { id: turnoId, estado: "PUBLICADO", cuposDisponibles: { gt: 0 } },
    data: { cuposDisponibles: { decrement: 1 } },
  });

  return count === 1;
}

export async function crearInscripcion(data, cliente = prisma) {
  return cliente.inscripcionTurno.create({
    data,
    select: CAMPOS_INSCRIPCION,
  });
}

export async function registrarHistorial(data, cliente = prisma) {
  return cliente.historialInscripcion.create({ data });
}

// Inscripciones del voluntario, opcionalmente filtradas por estado, con su turno.
// Las mas recientes primero.
export async function listarInscripcionesDeVoluntario(voluntarioId, estado, cliente = prisma) {
  return cliente.inscripcionTurno.findMany({
    where: { voluntarioId, ...(estado ? { estado } : {}) },
    select: CAMPOS_INSCRIPCION,
    orderBy: { createdAt: "desc" },
  });
}

// Una inscripcion por id, con su turno. Devuelve null si no existe.
export async function buscarInscripcionPorId(id, cliente = prisma) {
  return cliente.inscripcionTurno.findUnique({
    where: { id },
    select: CAMPOS_INSCRIPCION,
  });
}

// Historial de una inscripcion en orden cronologico, con el titulo y horario de
// los turnos involucrados y quien hizo cada operacion.
export async function listarHistorialDeInscripcion(inscripcionId, cliente = prisma) {
  return cliente.historialInscripcion.findMany({
    where: { inscripcionId },
    select: {
      id: true,
      accion: true,
      detalle: true,
      fecha: true,
      turno: { select: { id: true, titulo: true, inicio: true, termino: true } },
      turnoAnterior: { select: { id: true, titulo: true, inicio: true, termino: true } },
      realizadoPor: { select: { id: true, nombre: true, rol: true } },
    },
    orderBy: { fecha: "asc" },
  });
}

// Devuelve el cupo de un turno. Se usa al cancelar o cambiar de turno.
export async function liberarCupo(turnoId, cliente = prisma) {
  await cliente.turno.update({
    where: { id: turnoId },
    data: { cuposDisponibles: { increment: 1 } },
  });
}

// Marca la inscripcion como cancelada. Nunca se borra: queda en el historial.
export async function cancelarInscripcion(id, canceladaEn, cliente = prisma) {
  return cliente.inscripcionTurno.update({
    where: { id },
    data: { estado: "CANCELADA", canceladaEn },
    select: CAMPOS_INSCRIPCION,
  });
}

