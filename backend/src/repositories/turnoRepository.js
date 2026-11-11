import prisma from "../config/prisma.js";

// Campos del turno que se devuelven a la pantalla.
const CAMPOS_TURNO = {
  id: true,
  titulo: true,
  descripcion: true,
  inicio: true,
  termino: true,
  fechaLimiteInscripcion: true,
  cupoMaximo: true,
  cuposDisponibles: true,
  estado: true,
  publicadoPorId: true,
};

export async function crearTurno(data, cliente = prisma) {
  return cliente.turno.create({ data, select: CAMPOS_TURNO });
}

// Todos los turnos, tambien los que ya pasaron, para la vista de la encargada.
export async function listarTurnosParaGestion(cliente = prisma) {
  return cliente.turno.findMany({
    select: CAMPOS_TURNO,
    orderBy: { inicio: "asc" },
  });
}

// Turnos publicados que todavia no comienzan, del mas cercano al mas lejano.
export async function listarTurnosPublicados(ahora, cliente = prisma) {
  return cliente.turno.findMany({
    where: { estado: "PUBLICADO", inicio: { gt: ahora } },
    select: CAMPOS_TURNO,
    orderBy: { inicio: "asc" },
  });
}