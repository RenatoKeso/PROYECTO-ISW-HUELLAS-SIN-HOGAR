import { z } from "zod";
import { diaEnChile } from "./adopcionValidation.js";

export const MOTIVO_DEVOLUCION_VALUES = [
  "COMPORTAMIENTO",
  "SALUD",
  "CAMBIO_SITUACION_FAMILIAR",
  "OTRO",
];

const idSchema = z
  .number({ message: "El id debe ser un número" })
  .int("El id debe ser un número entero")
  .positive("El id debe ser mayor a cero");


const fechaDevolucionSchema = z.iso
  .date({ message: "La fecha debe tener el formato AAAA-MM-DD" })
  .refine((valor) => valor <= diaEnChile(), {
    message: "La fecha de devolución no puede ser futura",
  })
  .transform((valor) => new Date(`${valor}T00:00:00.000Z`));

export const devolucionSchema = z.strictObject({
  postulacionId: idSchema,
  receptorId: idSchema,
  fechaDevolucion: fechaDevolucionSchema,
  motivo: z.enum(MOTIVO_DEVOLUCION_VALUES, { message: "Elige un motivo de la lista" }),
  detalle: z
    .string({ message: "El detalle es obligatorio" })
    .trim()
    .min(1, "El detalle es obligatorio")
    .max(1000, "El detalle puede tener máximo 1000 caracteres"),
});