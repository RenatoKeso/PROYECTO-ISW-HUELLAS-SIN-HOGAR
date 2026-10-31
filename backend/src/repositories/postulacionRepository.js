import prisma from "../config/prisma.js";

// Mientras una postulacion esta en alguno de estos estados, sigue "abierta".
const ESTADOS_ABIERTOS = ["EN_REVISION", "APROBADA"];

const ANIMAL_RESUMEN = {
  id: true,
  codigoAnimal: true,
  nombre: true,
  especie: true,
};

const POSTULACION_RESUMEN = {
  id: true,
  nombrePostulante: true,
  rutPostulante: true,
  estado: true,
  createdAt: true,
  fechaResolucion: true,
  fichaAnimal: { select: ANIMAL_RESUMEN },
};

export async function buscarAnimalPorId(id, cliente = prisma) {
  return cliente.fichaAnimal.findUnique({
    where: { id },
    select: { ...ANIMAL_RESUMEN, estadoEstadia: true },
  });
}

export async function buscarPostulacionAbierta(
  { fichaAnimalId, rutPostulante },
  cliente = prisma,
) {
  return cliente.postulacion.findFirst({
    where: {
      fichaAnimalId,
      rutPostulante,
      estado: { in: ESTADOS_ABIERTOS },
    },
    select: { id: true },
  });
}

export async function crearPostulacion(data, cliente = prisma) {
  return cliente.postulacion.create({
    data,
    select: POSTULACION_RESUMEN,
  });
}

// Las mas antiguas primero: es el orden en que la encargada las revisa.
export async function listarPostulaciones({ estado } = {}, cliente = prisma) {
  return cliente.postulacion.findMany({
    where: estado ? { estado } : {},
    select: POSTULACION_RESUMEN,
    orderBy: { createdAt: "asc" },
  });
}

export async function buscarPostulacionPorId(id, cliente = prisma) {
  return cliente.postulacion.findUnique({
    where: { id },
    include: {
      fichaAnimal: {
        select: {
          ...ANIMAL_RESUMEN,
          sexoAnimal: true,
          raza: true,
          edad: true,
          estadoEstadia: true,
        },
      },
      revisor: { select: { id: true, nombre: true } },
    },
  });
}

// Devoluciones de cualquier adopcion anterior hecha con el mismo RUT.
export async function listarDevolucionesDelPostulante(rutPostulante, cliente = prisma) {
  return cliente.devolucion.findMany({
    where: { postulacion: { rutPostulante } },
    select: {
      id: true,
      fechaDevolucion: true,
      motivo: true,
      detalle: true,
      fichaAnimal: { select: { codigoAnimal: true, nombre: true } },
    },
    orderBy: { fechaDevolucion: "desc" },
  });
}

export async function registrarAlertaMostrada(id, fecha, cliente = prisma) {
  return cliente.postulacion.update({
    where: { id },
    data: { alertaMostradaEn: fecha },
  });
}

// Solo actualiza si la postulacion sigue EN_REVISION. Asi, si dos personas la
// resuelven al mismo tiempo, solo la primera decision queda guardada.
// Devuelve cuantas filas cambio (0 o 1).
export async function resolverPostulacionEnRevision(id, data, cliente = prisma) {
  const { count } = await cliente.postulacion.updateMany({
    where: { id, estado: "EN_REVISION" },
    data,
  });

  return count;
}