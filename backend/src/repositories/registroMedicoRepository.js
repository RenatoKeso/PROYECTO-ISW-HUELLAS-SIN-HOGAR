import prisma from "../config/prisma.js";

const RELACIONES_REGISTRO_MEDICO = {
  animal: true,
  ingresoAnimal: true,
};

export async function crearRegistroMedico(data, cliente = prisma) {
  return cliente.registroMedicoAnimal.create({ data });
}

export async function obtenerRegistroMedicoPorFicha(animalId, cliente = prisma) {
  return cliente.registroMedicoAnimal.findUnique({
    where: { animalId },
    include: RELACIONES_REGISTRO_MEDICO,
  });
}

export async function obtenerRegistroMedicoPorId(id, cliente = prisma) {
  return cliente.registroMedicoAnimal.findUnique({
    where: { id },
    include: RELACIONES_REGISTRO_MEDICO,
  });
}

export async function actualizarRegistroMedico(id, data, cliente = prisma) {
  return cliente.registroMedicoAnimal.update({ where: { id }, data });
}  