import prisma from "../config/prisma.js";

export async function crearIngresoAnimal(data, cliente = prisma) {
  return cliente.ingresoAnimal.create({ data });
}

export async function listarIngresosPorFicha(fichaAnimalId, cliente = prisma) {
  return cliente.ingresoAnimal.findMany({
    where: { fichaAnimalId },
    orderBy: [{ fechaIngreso: "desc" }, { id: "desc" }],
    include: {
      receptor: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
}
