import { z } from "zod";
import { TipoAtencionSanitaria } from "@prisma/client";
import { fechaSanitariaSchema } from "./alertasSanitariasValidation.js";
import { codigoAnimalSchema } from "./fichaAnimalValidation.js";

export const codigoPlanSchema = z.strictObject({
  codigo: codigoAnimalSchema,
});

export const idAtencionSchema = z.strictObject({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().positive()),
});

export const programarAtencionSchema = z.strictObject({
  tipo: z.enum(TipoAtencionSanitaria),
  fechaProgramada: fechaSanitariaSchema,
  observaciones: z.string().trim().max(2000).optional(),
});

export const modificarAtencionSchema = z.discriminatedUnion(
  "accion",
  [
    z.strictObject({
      accion: z.literal("reprogramar"),
      fechaProgramada: fechaSanitariaSchema,
    }),

    z.strictObject({
      accion: z.literal("realizar"),
      fechaRealizacion: fechaSanitariaSchema,
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