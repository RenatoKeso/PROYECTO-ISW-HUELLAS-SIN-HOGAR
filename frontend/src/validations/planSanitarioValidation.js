import { z } from "zod";
import { TIPOS_PLAN } from "./alertasPlanValidation.js";

export const codigoPlanSchema = z
  .string()
  .trim()
  .regex(
    /^anim-\d+$/,
    "Ingresa un codigo como anim-001"
  );

const fechaSchema = z.string().refine((valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}, "Ingresa una fecha valida");

export const programarAtencionSchema = z.strictObject({
  tipo: z.enum(TIPOS_PLAN),
  fechaProgramada: fechaSchema,
  observaciones: z.string().trim().max(2000).optional(),
});

export const modificarAtencionSchema = z.discriminatedUnion(
  "accion",
  [
    z.strictObject({
      accion: z.literal("reprogramar"),
      fechaProgramada: fechaSchema,
    }),

    z.strictObject({
      accion: z.literal("realizar"),
      fechaRealizacion: fechaSchema,
    }),

    z.strictObject({
      accion: z.literal("cancelar"),
      motivoCancelacion: z
        .string()
        .trim()
        .min(1, "Indica el motivo de cancelacion")
        .max(500),
    }),
  ]
);

const atencionSchema = z.object({
  id: z.number().int().positive(),
  fichaAnimalId: z.number().int().positive(),
  registroMedicoId: z
    .number()
    .int()
    .positive()
    .nullable(),

  tipo: z.enum(TIPOS_PLAN),
  fechaProgramada: fechaSchema,
  estado: z.enum([
    "PENDIENTE",
    "REALIZADA",
    "CANCELADA",
  ]),
  fechaRealizacion: fechaSchema.nullable(),
  motivoCancelacion: z.string().nullable(),
  observaciones: z.string().nullable(),
});

export const respuestaAtencionSchema = z.object({
  atencion: atencionSchema,
});

export const respuestaPlanSchema = z.object({
  animal: z.object({
    id: z.number().int().positive(),
    codigoAnimal: codigoPlanSchema,
    nombre: z.string().nullable(),
    estadoEstadia: z.enum([
      "ACTIVO",
      "ESPERA_ADOPCION",
      "ADOPTADO",
      "EGRESADO",
      "FALLECIDO",
      "TRANSFERIDO",
    ]),
    registroMedicoId: z
      .number()
      .int()
      .positive()
      .nullable(),
  }),

  atenciones: z.array(atencionSchema),
});