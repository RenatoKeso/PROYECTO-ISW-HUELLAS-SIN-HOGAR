import { z } from "zod";
import { textoOpcionalSchema } from "./fichaValidation.js";

export const RECEPTORES = [
  { valor: "6", texto: "Martina Concha" },
  { valor: "7", texto: "Tomas morales" },
];

export const ingresoFormSchema = z.strictObject({
  codigoAnimal: z
    .string()
    .trim()
    .min(1, "Indica el código de la ficha")
    .regex(/^anim-\d+$/, "El código debe tener el formato anim-001"),
  receptorId: z
    .coerce.number({ message: "Selecciona el receptor del ingreso" })
    .int("Selecciona el receptor del ingreso")
    .positive("Selecciona el receptor del ingreso"),
  fechaIngreso: z
    .string()
    .min(1, "Selecciona la fecha y hora de ingreso")
    .refine((valor) => !Number.isNaN(new Date(valor).getTime()), {
      message: "La fecha de ingreso no es válida",
    }),
  procedencia: z
    .string()
    .trim()
    .min(1, "La procedencia no puede estar vacía")
    .max(255, "La procedencia no puede superar los 255 caracteres"),
  ubicacionEncontrado: textoOpcionalSchema,
  estadoSalud: textoOpcionalSchema,
});
