import prisma from "../config/prisma.js";

export async function buscarDevolucionesPorFecha (fechaDesde, fechaHasta, cliente = prisma) {
   return cliente.devolucion.findMany({
    where: {
      fechaDevolucion: { gte: fechaDesde, lte: fechaHasta },
    },
    include: {
      fichaAnimal: { select: { id: true, codigoAnimal: true, nombre: true } },
    },
    orderBy: { fechaDevolucion: "asc" },
  });
} 

export async function guardarReporteDevolucion(data, cliente = prisma) {
  return cliente.reporteDevolucion.create({ data });
}

export async function listarReportesDevolucion(cliente = prisma) {
  return cliente.reporteDevolucion.findMany({
    orderBy: { createdAt: "desc" },
  });
}