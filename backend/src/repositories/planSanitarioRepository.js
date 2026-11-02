import prisma from "../config/prisma.js";

const CAMPOS_ATENCION = {
  id: true,
  fichaAnimalId: true,
  registroMedicoId: true,
  tipo: true,
  fechaProgramada: true,
  estado: true,
  fechaRealizacion: true,
  motivoCancelacion: true,
  observaciones: true,
};

export function buscarAnimalPlan(codigo, cliente = prisma) {
  return cliente.fichaAnimal.findUnique({
    where: { codigoAnimal: codigo },
    select: {
      id: true,
      codigoAnimal: true,
      nombre: true,
      estadoEstadia: true,
      registroMedicoAnimal: {
        select: { id: true },
      },
    },
  });
}

export function listarAtencionesPlan(
  animalId,
  cliente = prisma
) {
  return cliente.atencionSanitaria.findMany({
    where: { fichaAnimalId: animalId },
    select: CAMPOS_ATENCION,
    orderBy: [
      { fechaProgramada: "asc" },
      { id: "asc" },
    ],
  });
}

export function crearAtencionPlan(data, cliente = prisma) {
  return cliente.atencionSanitaria.create({
    data,
    select: CAMPOS_ATENCION,
  });
}

export function buscarAtencionPlan(id, cliente = prisma) {
  return cliente.atencionSanitaria.findUnique({
    where: { id },
    select: CAMPOS_ATENCION,
  });
}

export function modificarAtencionPendiente(
  id,
  data,
  cliente = prisma
) {
  return cliente.atencionSanitaria.updateMany({
    where: {
      id,
      estado: "PENDIENTE",
    },
    data,
  });
}