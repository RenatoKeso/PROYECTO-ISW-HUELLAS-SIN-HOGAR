import prisma from "../config/prisma.js";

// Campos del turno que se devuelven a la pantalla.
export const CAMPOS_TURNO = {
  id: true,
  titulo: true,
  descripcion: true,
  inicio: true,
  termino: true,
  fechaLimiteInscripcion: true,
  cupoMaximo: true,
  cuposDisponibles: true,
  estado: true,
  publicadoPorId: true,
  motivoCancelacion: true,
  canceladoEn: true,
};

export async function crearTurno(data, cliente = prisma) {
  return cliente.turno.create({ data, select: CAMPOS_TURNO });
}

// Todos los turnos, tambien los que ya pasaron, para la vista de la encargada.
export async function listarTurnosParaGestion(cliente = prisma) {
  return cliente.turno.findMany({
    select: CAMPOS_TURNO,
    orderBy: { inicio: "asc" },
  });
}

// Turnos publicados que todavia no comienzan, del mas cercano al mas lejano.
export async function listarTurnosPublicados(ahora, cliente = prisma) {
  return cliente.turno.findMany({
    where: { estado: "PUBLICADO", inicio: { gt: ahora } },
    select: CAMPOS_TURNO,
    orderBy: { inicio: "asc" },
  });
}

// Turnos que empiezan dentro del rango, publicados o cancelados, en orden.
// Los usa el calendario semanal.
export async function listarTurnosEntre(inicio, fin, cliente = prisma) {
  return cliente.turno.findMany({
    where: { inicio: { gte: inicio, lte: fin } },
    select: CAMPOS_TURNO,
    orderBy: { inicio: "asc" },
  });
}

// Cancela el turno solo si sigue publicado y no ha comenzado. La condicion va en
// la misma consulta (como reservarCupo): si cambio entre la lectura y este punto,
// no toca nada. Devuelve true si lo cancelo.
export async function cancelarTurno(id, { motivo, canceladoPorId, canceladoEn }, cliente = prisma) {
  const { count } = await cliente.turno.updateMany({
    where: { id, estado: "PUBLICADO", inicio: { gt: canceladoEn } },
    data: { estado: "CANCELADO", motivoCancelacion: motivo, canceladoPorId, canceladoEn },
  });

  return count === 1;
}

export async function buscarTurnoPorId(id, cliente = prisma) {
  return cliente.turno.findUnique({
    where: { id },
    select: CAMPOS_TURNO,
  });
}
