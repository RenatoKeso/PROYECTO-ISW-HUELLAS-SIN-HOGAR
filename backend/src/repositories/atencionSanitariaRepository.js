export const ESTADOS_EN_REFUGIO = [
    "ACTIVO",
    "ESPERA_ADOPCION",
];

export async function buscarAtencionesPendientes(
    { fechaLimite },
    cliente
) {
const prisma =
    cliente ?? (await import("../config/prisma.js")).default;

    return prisma.atencionSanitaria.findMany({
    where: {
      estado: "PENDIENTE",

      fechaProgramada: {
        lte: fechaLimite,
      },

      fichaAnimal: {
        is: {
          estadoEstadia: {
            in: ESTADOS_EN_REFUGIO,
          },
        },
      },
    },

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