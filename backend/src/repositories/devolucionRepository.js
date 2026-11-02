import prisma from "../config/prisma.js";

export async function buscarPostulacionParaDevolucion(id, cliente = prisma) {
  return cliente.postulacion.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      fechaEntrega: true,
      fichaAnimalId: true,
      fichaAnimal: {
        select: { nombre: true, codigoAnimal: true, estadoEstadia: true },
      },
    },
  });
}

export async function buscarVoluntarioActivo(id, cliente = prisma) {
  return cliente.voluntario.findFirst({ where: { id, activo: true } });
}

export async function contarDevolucionesPorMotivo(fichaAnimalId, motivo, cliente = prisma) {
  return cliente.devolucion.count({ where: { fichaAnimalId, motivo } });
}
// ---------- Registro (se usan dentro de una transaccion) ----------

export async function crearDevolucion(data, cliente = prisma) {
  return cliente.devolucion.create({ data });
}

// Solo cambia si el animal sigue ADOPTADO. Devuelve cuantas filas cambio (0 o 1).
export async function marcarAnimalActivo(fichaAnimalId, cliente = prisma) {
  const { count } = await cliente.fichaAnimal.updateMany({
    where: { id: fichaAnimalId, estadoEstadia: "ADOPTADO" },
    data: { estadoEstadia: "ACTIVO" },
  });

  return count;
}

// Solo cierra si la postulacion sigue ENTREGADA. Devuelve 0 o 1.
export async function cerrarPostulacionEntregada(id, cliente = prisma) {
  const { count } = await cliente.postulacion.updateMany({
    where: { id, estado: "ENTREGADA" },
    data: { estado: "CERRADA" },
  });

  return count;
}

// ---------- Para el formulario ----------

export async function listarPostulacionesEntregadas(cliente = prisma) {
  return cliente.postulacion.findMany({
    where: { estado: "ENTREGADA", fichaAnimal: { estadoEstadia: "ADOPTADO" } },
    select: {
      id: true,
      nombrePostulante: true,
      fechaEntrega: true,
      fichaAnimal: { select: { codigoAnimal: true, nombre: true } },
    },
    orderBy: { fechaEntrega: "desc" },
  });
}