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

export async function listarIngresosAnimales(cliente = prisma) {
  return cliente.ingresoAnimal.findMany({
    orderBy: [{ fechaIngreso: "desc" }, { id: "desc" }],
    include: {
      fichaAnimal: {
        select: {
          id: true,
          codigoAnimal: true,
          nombre: true,
        },
      },
      receptor: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
}
