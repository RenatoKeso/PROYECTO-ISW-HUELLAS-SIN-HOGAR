import prisma from "../config/prisma.js";

export async function buscarDevolucionesPorFecha (fechaDesde, fechaHasta, cliente = prisma) {
   return cliente.devolucion.findMany({
    where: {
      fechaDevolucion: { gte: fechaDesde, lte: fechaHasta },
    },
    include: {
      fichaAnimal: {
        select: {
          id: true,
          codigoAnimal: true,
          nombre: true,
          especie: true,
          sexoAnimal: true,
          raza: true,
          edad: true,
          estadoEstadia: true,
        },
      },
      receptor: { select: { nombre: true } },
      postulacion: { select: { nombrePostulante: true } },
    },
    orderBy: { fechaDevolucion: "asc" },
  });
} 

export async function guardarReporteDevolucion(data, cliente = prisma) {
  return cliente.reporteDevolucion.create({
    data,
    include: { generadoPor: { select: { nombre: true } } },
  });
}

export async function listarReportesDevolucion(cliente = prisma) {
  return cliente.reporteDevolucion.findMany({
    include: { generadoPor: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });
}

