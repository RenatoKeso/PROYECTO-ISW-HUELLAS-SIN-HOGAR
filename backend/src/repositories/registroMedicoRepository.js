import prisma from "../config/prisma.js";

const RELACIONES_REGISTRO_MEDICO = {
  animal: true,
  ingresoAnimal: true,
  revisionInicial: true,
  revisionCompleta: true,
};

const SELECT_AUTOR = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
};

const RELACIONES_AUTOR = {
  actualizadoPor: { select: SELECT_AUTOR },
};

const RELACIONES_SEGUIMIENTO = {
  createdBy: { select: SELECT_AUTOR },
  seguimientosEnfermedad: {
    include: { enfermedad: true },
  },
  seguimientosTratamiento: {
    include: { tratamiento: true },
  },
};

export async function crearRegistroMedico(data, cliente = prisma) {
  return cliente.registroMedicoAnimal.create({ data });
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

export async function crearRevisionInicial(data, cliente = prisma) {
  return cliente.revisionInicial.create({ data });
}

export async function actualizarRevisionInicialBloqueada(
  id,
  data,
  cliente = prisma,
) {
  const { count } = await cliente.revisionInicial.updateMany({
    where: { id, fechaActualizacion: null },
    data,
  });

  return count;
}

export async function crearAuditoriasRevisionInicial(data, cliente = prisma) {
  return cliente.auditoriaRevisionInicial.createMany({ data });
}



export async function crearRevisionFinal(data, cliente = prisma) {
  const { registroMedicoId, createdById, ...datosActualizados } = data;

  return guardarRevisionCompleta(
    cliente,
    registroMedicoId,
    createdById,
    datosActualizados,
  );
}

async function guardarRevisionCompleta(cliente, registroMedicoId, createdById, datosActualizados) {
  return cliente.revisionCompleta.upsert({
    where: { registroMedicoId },
    create: {
      registroMedicoId,
      createdById,
      ...datosActualizados,
    },
    update: datosActualizados,
  });
}

export async function crearEnfermedad(data, cliente = prisma) {
  return cliente.enfermedadAnimal.create({ data });
}

export async function crearTratamiento(data, cliente = prisma) {
  return cliente.tratamientoAnimal.create({ data });
}

export async function crearAtencionSanitaria(data, cliente = prisma) {
  return cliente.atencionSanitaria.create({ data });
}

export async function actualizarRegistroMedicoSiEstado(
  id,
  estadosPermitidos,
  data,
  cliente = prisma,
) {
  const { count } = await cliente.registroMedicoAnimal.updateMany({
    where: {
      id,
      estadoValidacion: { in: estadosPermitidos },
    },
    data,
  });

  return count;
}

export async function obtenerUltimaVersionHistorial(
  registroMedicoId,
  cliente = prisma,
) {
  const historial = await cliente.historialRegistroMedico.findFirst({
    where: { registroMedicoId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  return historial?.version ?? 0;
}

export async function crearHistorialRegistroMedico(data, cliente = prisma) {
  return cliente.historialRegistroMedico.create({
    data,
    include: RELACIONES_AUTOR,
  });
}

export async function listarHistorialRegistroMedico(
  registroMedicoId,
  cliente = prisma,
) {
  return cliente.historialRegistroMedico.findMany({
    where: { registroMedicoId },
    include: RELACIONES_AUTOR,
    orderBy: { version: "desc" },
  });
}

export async function crearSeguimientoMedico(data, cliente = prisma) {
  return cliente.seguimientoMedicoAnimal.create({
    data,
    include: RELACIONES_SEGUIMIENTO,
  });
}

export async function listarSeguimientosMedicos(
  registroMedicoId,
  cliente = prisma,
) {
  return cliente.seguimientoMedicoAnimal.findMany({
    where: { registroMedicoId },
    include: RELACIONES_SEGUIMIENTO,
    orderBy: [{ fechaRegistro: "desc" }, { id: "desc" }],
  });
}

export async function obtenerEnfermedadesPorRegistroMedico(
  registroMedicoId,
  cliente = prisma,
) {
  return cliente.enfermedadAnimal.findMany({
    where: { registroMedicoId },
    select: {
      id: true,
      descripcionEnfermedad: true,
      tipoEnfermedad: true,
    },
    orderBy: { id: "asc" },
  });
}

export async function obtenerTratamientosPorRegistroMedico(
  registroMedicoId,
  cliente = prisma,
) {
  return cliente.tratamientoAnimal.findMany({
    where: { registroMedicoId },
    select: {
      id: true,
      descripcionTratamiento: true,
      fechaInicio: true,
      fechaFin: true,
      observaciones: true,
    },
    orderBy: { id: "asc" },
  });
}

export async function guardarRevisionCompletaActual(data, cliente = prisma) {
  const { registroMedicoId, createdById, ...datosActualizados } = data;

  return guardarRevisionCompleta(
    cliente,
    registroMedicoId,
    createdById,
    datosActualizados,
  );
}
