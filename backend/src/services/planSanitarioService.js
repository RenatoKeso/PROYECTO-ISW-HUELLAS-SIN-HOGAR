import { ejecutarEnTransaccion } from "../config/prisma.js";
import * as repositorio from "../repositories/planSanitarioRepository.js";
import { ESTADOS_EN_REFUGIO } from "../repositories/atencionSanitariaRepository.js";
import { PlanSanitarioError } from "../entities/planSanitarioErrors.js";
import {codigoPlanSchema,idAtencionSchema,programarAtencionSchema,modificarAtencionSchema,} from "../validations/planSanitarioValidation.js";

function exigirRegistro(registro, mensaje) {
  if (!registro) {
    throw new PlanSanitarioError(
      mensaje,
      404,
      "PLAN_REGISTRO_INEXISTENTE"
    );
  }

  return registro;
}

function serializar(atencion) {
  return {
    ...atencion,
    fechaProgramada: atencion.fechaProgramada
      .toISOString()
      .slice(0, 10),

    fechaRealizacion:
      atencion.fechaRealizacion
        ?.toISOString()
        .slice(0, 10) ?? null,
  };
}

const fecha = (valor) =>
  new Date(`${valor}T00:00:00.000Z`);

export function crearServicioPlanSanitario({
  repos = repositorio,
  transaccion = ejecutarEnTransaccion,
} = {}) {
  return {
    async consultar(codigo) {
      codigo = codigoPlanSchema.parse({ codigo }).codigo;

      return transaccion(async (tx) => {
        const animal = exigirRegistro(
          await repos.buscarAnimalPlan(codigo, tx),
          "El animal indicado no existe"
        );

        const atenciones = await repos.listarAtencionesPlan(
          animal.id,
          tx
        );

        const { registroMedicoAnimal, ...ficha } = animal;

        return {
          animal: {
            ...ficha,
            registroMedicoId:
              registroMedicoAnimal?.id ?? null,
          },
          atenciones: atenciones.map(serializar),
        };
      });
    },

    async programar(codigo, entrada) {
      codigo = codigoPlanSchema.parse({ codigo }).codigo;

      const datos = programarAtencionSchema.parse(entrada);

      return transaccion(async (tx) => {
        const animal = exigirRegistro(
          await repos.buscarAnimalPlan(codigo, tx),
          "El animal indicado no existe"
        );

        if (
          !ESTADOS_EN_REFUGIO.includes(
            animal.estadoEstadia
          )
        ) {
          throw new PlanSanitarioError(
            "Solo puedes programar atenciones de animales a cargo del refugio"
          );
        }

        const atencion = await repos.crearAtencionPlan(
          {
            ...datos,
            fichaAnimalId: animal.id,
            registroMedicoId:
              animal.registroMedicoAnimal?.id ?? null,
            fechaProgramada: fecha(datos.fechaProgramada),
            estado: "PENDIENTE",
          },
          tx
        );

        return serializar(atencion);
      });
    },

    async modificar(id, entrada) {
      id = idAtencionSchema.parse({
        id: String(id),
      }).id;

      const datos = modificarAtencionSchema.parse(entrada);

      return transaccion(async (tx) => {
        const actual = exigirRegistro(
          await repos.buscarAtencionPlan(id, tx),
          "La atencion indicada no existe"
        );

        if (actual.estado !== "PENDIENTE") {
          throw new PlanSanitarioError(
            "Solo puedes modificar atenciones pendientes"
          );
        }

        const cambios =
          datos.accion === "reprogramar"
            ? {
                fechaProgramada: fecha(
                  datos.fechaProgramada
                ),
              }
            : datos.accion === "realizar"
              ? {
                  estado: "REALIZADA",
                  fechaRealizacion: fecha(
                    datos.fechaRealizacion
                  ),
                  motivoCancelacion: null,
                }
              : {
                  estado: "CANCELADA",
                  motivoCancelacion:
                    datos.motivoCancelacion,
                  fechaRealizacion: null,
                };

        const resultado =
          await repos.modificarAtencionPendiente(
            id,
            cambios,
            tx
          );

        if (resultado.count !== 1) {
          throw new PlanSanitarioError(
            "La atencion cambio durante la operacion. Actualiza el plan e intenta nuevamente"
          );
        }

        return serializar(
          await repos.buscarAtencionPlan(id, tx)
        );
      });
    },
  };
}

export default crearServicioPlanSanitario();