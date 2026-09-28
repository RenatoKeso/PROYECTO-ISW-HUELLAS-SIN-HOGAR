import prisma from "../config/prisma.js";

const RELACIONES_INGRESO_ANIMAL = {
  fichaAnimal: true,
  receptor: true,
};

/*
export async function obtenerIngresoAnimalPorId(id) {
  return prisma.ingresoAnimal.findUnique({
    where: { id },
    include: RELACIONES_INGRESO_ANIMAL,
  });
}
*/

export async function crearIngresoAnimal(data, cliente = prisma) {
  return cliente.ingresoAnimal.create({ data });
}

export async function actualizarFichaAnimalEnIngreso(id, fichaAnimalId, cliente = prisma) {
  return cliente.ingresoAnimal.update({
    where: { id },
    data: { fichaAnimalId },
    include: RELACIONES_INGRESO_ANIMAL,
  });
}
