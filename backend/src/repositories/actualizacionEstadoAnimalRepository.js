import prisma from "../config/prisma.js";

export async function crearActualizacionEstadoAnimal(data, cliente = prisma) {
  return cliente.actualizacionEstadoAnimal.create({ data });
}
