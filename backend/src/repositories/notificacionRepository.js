import prisma from "../config/prisma.js";

export async function crearNotificacion(data, cliente = prisma) {
  return cliente.notificacion.create({ data });
}

export async function listarNotificacionesPorDestinatario(
  destinatarioId,
  cliente = prisma,
) {
  return cliente.notificacion.findMany({
    where: { destinatarioId },
    orderBy: { createdAt: "desc" },
  });
}

export async function marcarNotificacionLeida(
  id,
  destinatarioId,
  cliente = prisma,
) {
  const { count } = await cliente.notificacion.updateMany({
    where: { id, destinatarioId },
    data: { leida: true },
  });

  return count;
}
