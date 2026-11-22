import prisma from "../config/prisma.js";
import { filtroAtencionesPendientes } from "./atencionSanitariaRepository.js";

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

export function listarAgendaMes(desde, hasta, cliente = prisma) {
  return cliente.atencionSanitaria.findMany({
    where: filtroAtencionesPendientes({ gte: desde, lte: hasta }),
    select: {
      tipo: true,
      fechaProgramada: true,
      fichaAnimal: { select: { nombre: true } },
    },
    orderBy: [{ fechaProgramada: "asc" }, { id: "asc" }],
  });
}

export function buscarAnimalesPorNombre(nombre, pagina, porPagina, cliente = prisma) {
  // Los comodines de LIKE se buscan literalmente.
  const texto = nombre.replace(/[\\%_]/g, "\\$&");
  const condiciones = [{ nombre: { contains: texto, mode: "insensitive" } }];

  if (nombre.toLocaleLowerCase("es") === "sin nombre") {
    condiciones.push({ nombre: null });
  }

  return cliente.fichaAnimal.findMany({
    where: nombre ? { OR: condiciones } : {},
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    skip: (pagina - 1) * porPagina,
    take: porPagina + 1,
    select: {
      codigoAnimal: true,
      nombre: true,
      especie: true,
      sexoAnimal: true,
      raza: true,
      edad: true,
      createdAt: true,
    },
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