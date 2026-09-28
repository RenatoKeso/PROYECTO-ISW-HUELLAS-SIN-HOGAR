import { z } from "zod";
import { codigoAnimalSchema, optionalTextSchema } from "./fichaAnimalValidation.js";

const idSchema = z
  .number({ message: "El identificador debe ser un número" })
  .int("El identificador debe ser un número entero")
  .positive("El identificador debe ser mayor que cero");

export const procedenciaSchema = z
  .string()
  .trim()
  .min(1, "La procedencia no puede estar vacía")
  .max(255, "La procedencia no puede superar los 255 caracteres");

export const fechaIngresoSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const ingresoAnimalCreateSchema = z
  .strictObject({
    fichaAnimalId: idSchema.optional(),
    codigoAnimal: codigoAnimalSchema.optional(),
    receptorId: idSchema,
    fechaIngreso: fechaIngresoSchema,
    procedencia: procedenciaSchema,
    ubicacionEncontrado: optionalTextSchema.optional(),
    estadoSalud: optionalTextSchema.optional(),
  })
  .refine(
    (data) => data.fichaAnimalId === undefined || data.codigoAnimal === undefined,
    {
      message:
        "Indica la ficha existente por id o por código, pero no por ambos a la vez",
      path: ["codigoAnimal"],
    },
  );
