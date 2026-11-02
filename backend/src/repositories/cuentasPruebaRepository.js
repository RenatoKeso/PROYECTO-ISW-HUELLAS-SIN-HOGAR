import prisma from "../config/prisma.js";

const ROLES_VOLUNTARIOS = [
  "VOLUNTARIO",
  "VOLUNTARIO_CONFIANZA",
];

export function crearCuentasPrueba(
  cuentas,
  cliente = prisma
) {
  return cliente.$transaction(
    async (tx) => {
      const resultados = [];

      for (const cuenta of cuentas) {
        const existente =
          await tx.usuario.findUnique({
            where: {
              email: cuenta.email,
            },
          });

        if (existente) {
          if (existente.rol !== cuenta.rol) {
            throw new Error(
              `La cuenta ${cuenta.email} ya existe con otro rol. No se guardaron cambios.`
            );
          }

          resultados.push({
            email: cuenta.email,
            rol: cuenta.rol,
            creada: false,
            activo: existente.activo,
          });

          continue;
        }

        let voluntarioId = null;

        if (ROLES_VOLUNTARIOS.includes(cuenta.rol)) {
          let voluntario =
            await tx.voluntario.findUnique({
              where: {
                email: cuenta.email,
              },
              include: {
                usuario: {
                  select: {
                    id: true,
                  },
                },
              },
            });

          if (
            voluntario &&
            (!voluntario.activo || voluntario.usuario)
          ) {
            throw new Error(
              `El voluntario ${cuenta.email} esta inactivo o ya tiene una cuenta. No se guardaron cambios.`
            );
          }

          if (!voluntario) {
            voluntario = await tx.voluntario.create({
              data: {
                nombre: cuenta.nombre,
                email: cuenta.email,
                activo: true,
              },
            });
          }

          voluntarioId = voluntario.id;
        }

        await tx.usuario.create({
          data: {
            nombre: cuenta.nombre,
            email: cuenta.email,
            rol: cuenta.rol,
            passwordHash: cuenta.passwordHash,
            activo: true,
            voluntarioId,
          },
        });

        resultados.push({
          email: cuenta.email,
          rol: cuenta.rol,
          creada: true,
          activo: true,
        });
      }

      return resultados;
    },
    {
      timeout: 30000,
      maxWait: 10000,
    }
  );
}