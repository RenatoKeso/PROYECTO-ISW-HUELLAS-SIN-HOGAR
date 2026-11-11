import prisma from "../config/prisma.js";

const CAMPOS_POSTULACION = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  diasDisponibles: true,
  motivacion: true,
  habilidades: true,
  otraHabilidad: true,
  estado: true,
  motivoRechazo: true,
  fechaRevision: true,
  voluntarioId: true,
  createdAt: true,
  revisadaPor: { select: { nombre: true } },
};


export async function buscarVoluntarioPorEmail(email, cliente = prisma) {
  return cliente.voluntario.findUnique({ where: { email } });
}

export async function buscarPostulacionVigente( email, cliente = prisma) {
  return cliente.postulacionVoluntario.findFirst({
    where: {
      estado: { in: ["EN_REVISION", "ACEPTADA"] },
       email,
    },
    select: { id: true, estado: true },
  });
}

export async function crearPostulacionVoluntario(data, cliente = prisma) {
  return cliente.postulacionVoluntario.create({ data, select: CAMPOS_POSTULACION });
}

export async function listarPostulacionesVoluntario(estado, cliente = prisma) {
  return cliente.postulacionVoluntario.findMany({
    where: estado ? { estado } : {},
    select: CAMPOS_POSTULACION,
    orderBy: { createdAt: "desc" },
  });
}

export async function buscarPostulacionVoluntarioPorId(id, cliente = prisma) {
  return cliente.postulacionVoluntario.findUnique({
    where: { id },
    select: CAMPOS_POSTULACION,
  });
}



export async function crearVoluntario(data, cliente = prisma) {
  return cliente.voluntario.create({ data });
}


export async function marcarPostulacionRevisada(id, data, cliente = prisma) {
  const { count } = await cliente.postulacionVoluntario.updateMany({
    where: { id, estado: "EN_REVISION" },
    data,
  });

  return count;
}

export async function buscarActividadVoluntario(id, cliente = prisma) {
  return cliente.voluntario.findUnique({
    where: { id },
    select: {
      id: true,
      usuario: { select: { id: true } },
      _count: {
        select: {
          inscripcionesTurno: true,
          ingresosRecibidos: true,
          devolucionesRecibidas: true,
        },
      },
    },
  });
}
export async function volverARevision(id, estadoActual, cliente = prisma) {
  const { count } = await cliente.postulacionVoluntario.updateMany({
    where: { id, estado: estadoActual },
    data: {
      estado: "EN_REVISION",
      motivoRechazo: null,
      fechaRevision: null,
      revisadaPorId: null,
      voluntarioId: null,
    },
  });

  return count;
}

export async function eliminarVoluntario(id, cliente = prisma) {
  return cliente.voluntario.delete({ where: { id } });
}
