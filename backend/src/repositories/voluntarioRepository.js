import prisma from "../config/prisma.js";

export async function listarVoluntarios(cliente = prisma) {
  return cliente.voluntario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}