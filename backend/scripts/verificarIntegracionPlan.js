import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import express from "express";
import prisma from "../src/config/prisma.js";
import { crearRouter } from "../src/routes/index.js";
import { manejadorErrores } from "../src/handlers/manejadorErrores.js";
import { crearAuthService } from "../src/services/authService.js";
import { crearServicioPlanSanitario } from "../src/services/planSanitarioService.js";
import { obtenerAlertasPlan } from "../src/services/alertasPlan.service.js";
import { obtenerFechaActual } from "../src/services/alertasSanitarias.service.js";
import { ROLES_USUARIO } from "../src/services/permisosUsuario.js";
import { registrarIngreso } from "../src/services/animalService.js";
import {
  crearFichaAnimal,
  obtenerFichaAnimalPorCodigo,
  actualizarFichaAnimal,
} from "../src/repositories/fichaAnimalRepository.js";
import { crearIngresoAnimal } from "../src/repositories/ingresoAnimalRepository.js";
import { buscarAtencionesPendientes } from "../src/repositories/atencionSanitariaRepository.js";
import { respuestaPlanSchema } from "../../frontend/src/validations/planSanitarioValidation.js";
import { respuestaAlertasPlanSchema } from "../../frontend/src/validations/alertasPlanValidation.js";

const lote = `VERIFICACION RF11 ${randomUUID()}`;
const referencia = obtenerFechaActual();

const dia = (n) =>
  new Date(
    new Date(`${referencia}T00:00:00Z`).getTime() +
      n * 86400000
  )
    .toISOString()
    .slice(0, 10);

const revertir = new Error("REVERTIR_PRUEBA_RF11");
const emails = [];
let terminado = false;

try {
  const password = randomBytes(24).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  const secreto = randomBytes(48).toString("hex");

  await prisma.$transaction(
    async (tx) => {
      const usuarios = {};

      for (const rol of ROLES_USUARIO) {
        const email =
          `${rol.toLowerCase()}.` +
          `${randomUUID()}@example.test`;

        emails.push(email);

        usuarios[rol] = await tx.usuario.create({
          data: {
            nombre: lote,
            email,
            passwordHash,
            rol,
          },
        });
      }

      const animales = [];

      for (const estadoEstadia of [
        "ACTIVO",
        "ESPERA_ADOPCION",
      ]) {
        animales.push(
          await crearFichaAnimal(
            {
              especie: "PERRO",
              sexoAnimal: "DESCONOCIDO",
              estadoEstadia,
              observaciones: lote,
            },
            tx
          )
        );
      }

      const [animal, externo] = animales;

      await tx.registroMedicoAnimal.create({
        data: {
          animalId: animal.id,
          revisionInicial: {
            create: {
              cuarentena: true,
              createdById: usuarios.VETERINARIA.id,
            },
          },
        },
      });

      await tx.registroMedicoAnimal.create({
        data: {
          animalId: externo.id,
          atencionesVeterinarias: {
            create: {
              nombreClinicaExterna: lote,
              fechaAtencion: new Date(),
              createdById: usuarios.VETERINARIA.id,
            },
          },
        },
      });

      const receptor = await tx.voluntario.create({
        data: {
          nombre: lote,
          email: `${randomUUID()}@example.test`,
        },
      });

      const transaccion = (operacion) =>
        operacion(tx);

      const servicioAuth = crearAuthService({
        secreto: () => secreto,

        repo: {
          buscarUsuarioPorEmail: (email) =>
            tx.usuario.findUnique({
              where: { email },
            }),

          buscarUsuarioPorId: (id) =>
            tx.usuario.findUnique({
              where: { id },
            }),

          invalidarSesiones: (id) =>
            tx.usuario.update({
              where: { id },
              data: {
                tokenVersion: { increment: 1 },
              },
            }),
        },
      });

      const app = express();

      app.use(express.json());

      app.use(
        "/api",
        crearRouter({
          servicioAuth,

          servicioPlan: crearServicioPlanSanitario({
            transaccion,
          }),

          consultarAlertas: (filtros) =>
            obtenerAlertasPlan(filtros, {
              buscar: (filtro) =>
                buscarAtencionesPendientes(
                  filtro,
                  tx
                ),
            }),

          registrarIngresoAnimal: (datos) =>
            registrarIngreso(datos, {
              ejecutarEnTransaccion: transaccion,
              obtenerFichaAnimalPorCodigo,
              actualizarFichaAnimal,
              crearIngresoAnimal,
            }),
        })
      );

      app.use(manejadorErrores);

      const servidor = app.listen(0, "127.0.0.1");

      try {
        await once(servidor, "listening");

        const tokens = {};

        async function solicitar(
          ruta,
          metodo = "GET",
          cuerpo,
          rol = "VETERINARIA",
          esperado = 200
        ) {
          const respuesta = await fetch(
            `http://127.0.0.1:${servidor.address().port}/api${ruta}`,
            {
              method: metodo,
              headers: {
                "Content-Type": "application/json",
                Connection: "close",

                ...(tokens[rol]
                  ? {
                      Authorization:
                        `Bearer ${tokens[rol]}`,
                    }
                  : {}),
              },

              ...(cuerpo === undefined
                ? {}
                : {
                    body: JSON.stringify(cuerpo),
                  }),
            }
          );

          const datos = await respuesta.json();

          assert.equal(
            respuesta.status,
            esperado,
            `${metodo} ${ruta}: ` +
              `${datos.message ?? respuesta.status}`
          );

          return datos;
        }

        for (const rol of ROLES_USUARIO) {
          const sesion = await solicitar(
            "/auth/login",
            "POST",
            {
              email: usuarios[rol].email,
              password,
            }
          );

          tokens[rol] = sesion.token;
        }

        const rutaPlan =
          `/salud/plan/${animal.codigoAnimal}`;

        await solicitar(
          rutaPlan,
          "GET",
          undefined,
          "SIN_SESION",
          401
        );

        for (const rol of ROLES_USUARIO.filter(
          (r) =>
            !["VETERINARIA", "DIRECTORA"].includes(r)
        )) {
          await solicitar(
            rutaPlan,
            "GET",
            undefined,
            rol,
            403
          );

          await solicitar(
            `${rutaPlan}/atenciones`,
            "POST",
            {
              tipo: "vacuna",
              fechaProgramada: dia(0),
            },
            rol,
            403
          );
        }

        const tipos = [
          "vacuna",
          "tratamiento",
          "control",
          "desparasitacion",
          "esterilizacion",
        ];

        const atenciones = [];

        for (const [indice, tipo] of tipos.entries()) {
          const { atencion } = await solicitar(
            `${rutaPlan}/atenciones`,
            "POST",
            {
              tipo,
              fechaProgramada: dia(
                [-3, 0, 2, 5, 7][indice]
              ),
            },
            "VETERINARIA",
            201
          );

          assert.ok(atencion.registroMedicoId);
          atenciones.push(atencion);
        }

        const rutaAlertas =
          "/salud/alertas?diasAnticipacion=7" +
          `&fechaReferencia=${referencia}`;

        async function alertasAnimal() {
          const resultado =
            respuestaAlertasPlanSchema.parse(
              await solicitar(rutaAlertas)
            );

          return resultado.alertas.filter(
            (a) => a.animalId === animal.id
          );
        }

        assert.deepEqual(
          (await alertasAnimal()).map(
            (a) => a.diasRestantes
          ),
          [-3, 0, 2, 5, 7]
        );

        await solicitar(
          `/salud/plan/${externo.codigoAnimal}/atenciones`,
          "POST",
          {
            tipo: "control",
            fechaProgramada: dia(1),
          },
          "DIRECTORA",
          201
        );

        assert.ok(
          (await solicitar(rutaAlertas))
            .alertas.some(
              (a) => a.animalId === externo.id
            )
        );

        const rutaAtencion =
          `/salud/atenciones/${atenciones[0].id}`;

        await solicitar(
          rutaAtencion,
          "PATCH",
          {
            accion: "reprogramar",
            fechaProgramada: dia(20),
          }
        );

        assert.equal(
          (await alertasAnimal()).length,
          4
        );

        await solicitar(
          rutaAtencion,
          "PATCH",
          {
            accion: "reprogramar",
            fechaProgramada: dia(-3),
          }
        );

        assert.equal(
          (await alertasAnimal()).length,
          5
        );

        await solicitar(
          rutaAtencion,
          "PATCH",
          {
            accion: "realizar",
            fechaRealizacion: dia(0),
          }
        );

        await solicitar(
          rutaAtencion,
          "PATCH",
          {
            accion: "cancelar",
            motivoCancelacion: "Prueba",
          },
          "VETERINARIA",
          409
        );

        await solicitar(
          `/salud/atenciones/${atenciones[1].id}`,
          "PATCH",
          {
            accion: "cancelar",
            motivoCancelacion:
              "Cambio de indicacion",
          }
        );

        assert.equal(
          (await alertasAnimal()).length,
          3
        );

        const historial = respuestaPlanSchema.parse(
          await solicitar(rutaPlan)
        );

        assert.equal(
          historial.atenciones.length,
          5
        );

        assert.equal(
          historial.atenciones.filter(
            (a) => a.estado === "REALIZADA"
          ).length,
          1
        );

        assert.equal(
          historial.atenciones.filter(
            (a) => a.estado === "CANCELADA"
          ).length,
          1
        );

        for (const estadoEstadia of [
          "ADOPTADO",
          "EGRESADO",
          "FALLECIDO",
          "TRANSFERIDO",
        ]) {
          await tx.fichaAnimal.update({
            where: { id: animal.id },
            data: { estadoEstadia },
          });

          assert.equal(
            (await alertasAnimal()).length,
            0
          );
        }

        await solicitar(
          "/animales/ingresos",
          "POST",
          {
            codigoAnimal: animal.codigoAnimal,
            receptorId: receptor.id,
            fechaIngreso: new Date().toISOString(),
            procedencia:
              "Reingreso de verificacion RF11",
          },
          "DIRECTORA"
        );

        assert.equal(
          (await alertasAnimal()).length,
          3
        );

        const snapshot = () =>
          tx.atencionSanitaria.findMany({
            where: {
              fichaAnimalId: {
                in: animales.map((a) => a.id),
              },
            },
            orderBy: { id: "asc" },
          });

        const antes = await snapshot();

        await solicitar(rutaPlan);
        await solicitar(rutaAlertas);

        assert.deepEqual(
          await snapshot(),
          antes
        );

        await solicitar(
          "/auth/logout",
          "POST"
        );

        await solicitar(
          rutaPlan,
          "GET",
          undefined,
          "VETERINARIA",
          401
        );
      } finally {
        await new Promise((resolve, reject) => {
          servidor.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      terminado = true;
      throw revertir;
    },
    {
      timeout: 60000,
      maxWait: 10000,
    }
  );
} catch (error) {
  if (error !== revertir) {
    console.error(
      "Fallo la integracion RF11:",
      error.code ?? error.name
    );

    if (!error.name?.startsWith("Prisma")) {
      console.error(error.message);
    }

    process.exitCode = 1;
  }
} finally {
  if (terminado) {
    try {
      assert.equal(
        await prisma.usuario.count({
          where: {
            email: { in: emails },
          },
        }),
        0
      );

      assert.equal(
        await prisma.fichaAnimal.count({
          where: {
            observaciones: lote,
          },
        }),
        0
      );

      console.log(
        "Integracion RF11 correcta: login, permisos, plan, alertas, historial y reingreso."
      );

      console.log(
        "Todos los registros de prueba se revirtieron."
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }

  await prisma.$disconnect();
}