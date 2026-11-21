export const ESTADOS_EN_REFUGIO = [
  "ACTIVO",
  "ESPERA_ADOPCION",
];

export function filtroAtencionesPendientes(fechaProgramada) {
  return {
    estado: "PENDIENTE",
    fechaProgramada,
    fichaAnimal: { is: { estadoEstadia: { in: ESTADOS_EN_REFUGIO } } },
  };
}

export async function buscarAtencionesPendientes(
  { fechaLimite },
  cliente
) {
  const prisma =
    cliente ?? (await import("../config/prisma.js")).default;

  return prisma.atencionSanitaria.findMany({
    where: filtroAtencionesPendientes({ lte: fechaLimite }),
    select: {
      id: true,
      fichaAnimalId: true,
      tipo: true,
      fechaProgramada: true,
      fichaAnimal: {
        select: {
          codigoAnimal: true,
          nombre: true,
        },
      },
    },
    orderBy: [
      { fechaProgramada: "asc" },
      { id: "asc" },
    ],
  });
}