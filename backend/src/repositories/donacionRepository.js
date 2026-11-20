import prisma from "../config/prisma.js";
import { ESTADOS_EN_REFUGIO } from "./atencionSanitariaRepository.js";

const campos = {
    folio: true,
    destino: true,
    monto: true,
    medioPago: true,
    fechaAporte: true,
    anonima: true,
    nombreDonante: true,
    emailDonante: true,
    telefonoDonante: true,
    estado: true,
    comprobanteNombre: true,
    motivoRechazo: true,
    revisadaEn: true,

    animal: {
    select: {
        nombre: true,
        codigoAnimal: true,
    },
},

    revisadaPor: {
    select: {
    nombre: true,
    },
    },
};

const literal = (texto) =>
    texto.replace(/[\\%_]/g, "\\$&");

export function bloquearAnimal(codigo, cliente) {
    return cliente.$queryRaw`
    SELECT "id", "estadoEstadia"
    FROM "FichaAnimal"
    WHERE "codigoAnimal" = ${codigo}
    FOR UPDATE
`;
}

export function crear(datos, cliente) {
    return cliente.donacion.create({
    data: datos,
    select: {
    folio: true,
    estado: true,
    },
  });
}

export function buscar(folio) {
    return prisma.donacion.findUnique({
    where: { folio },
    select: campos,
  });
}

export function revisarPendiente(folio, cambios) {
  return prisma.donacion.updateMany({
    where: {
    folio,
    estado: "PENDIENTE",
    },
    data: cambios,
  });
}

export function comprobante(folio) {
    return prisma.donacion.findUnique({
    where: { folio },
    select: {
    comprobante: true,
    },
  });
}

export function animales(nombre, pagina) {
  return prisma.fichaAnimal.findMany({
    where: {
    estadoEstadia: {
        in: ESTADOS_EN_REFUGIO,
    },

      ...(nombre
        ? {
            nombre: {
                contains: literal(nombre),
                mode: "insensitive",
            },
          }
        : {}),
    },

    select: {
    codigoAnimal: true,
    nombre: true,
    especie: true,
    raza: true,
    },

    orderBy: [
    { nombre: "asc" },
    { id: "asc" },
    ],

    skip: (pagina - 1) * 6,
    take: 7,
  });
}

export function listar({
desde,
hasta,
estado,
destino,
codigoAnimal,
donante,
animal,
pagina,
}) {
  const where = {
    ...(estado ? { estado } : {}),
    ...(destino ? { destino } : {}),

    ...(codigoAnimal || animal
    ? {
        animal: {
            is: {
            ...(codigoAnimal
                ? { codigoAnimal }
                : {}),

            ...(animal
                ? {
                    nombre: {
                    contains: literal(animal),
                    mode: "insensitive",
                    },
                }
                : {}),
            },
        },
        }
    : {}),

    ...(desde || hasta
    ? {
        fechaAporte: {
            ...(desde
            ? {
                gte: new Date(
                    desde + "T00:00:00Z"
                ),
                }
            : {}),

            ...(hasta
            ? {
                lte: new Date(
                    hasta + "T00:00:00Z"
                ),
                }
            : {}),
        },
        }
    : {}),

    ...(donante
    ? {
        OR: [
            "nombreDonante",
            "emailDonante",
            "telefonoDonante",
        ].map((campo) => ({
            [campo]: {
            contains: literal(donante),
            mode: "insensitive",
            },
        })),
        }
    : {}),
    };

  return prisma.$transaction(
    async (cliente) => {
        const filas = await cliente.donacion.findMany({
        
        where,
        select: campos,

        orderBy: [
            { fechaAporte: "desc" },
            { id: "desc" },
        ],

        skip: (pagina - 1) * 6,
        take: 7,
      });

      const resumen =
        await cliente.donacion.aggregate({
          where: {
            AND: [
            where,
            { estado: "CONFIRMADA" },
            ],
          },
          _sum: {
            monto: true,
          },
          _count: true,
        });

      return {
        donaciones: filas.slice(0, 6),
        hayMas: filas.length > 6,
        totalConfirmado: String(
          resumen._sum.monto ?? 0
        ),
        cantidadConfirmadas: resumen._count,
      };
    },
    {
      isolationLevel: "RepeatableRead",
    }
  );
}