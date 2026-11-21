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

export const mesAgendaSchema = z.strictObject({
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Selecciona un mes válido"),
});

export const busquedaAnimalesSchema = z.strictObject({
  nombre: z.string().trim().max(100).default(""),
  pagina: z.coerce.number().int().positive().max(1000000).default(1),
});