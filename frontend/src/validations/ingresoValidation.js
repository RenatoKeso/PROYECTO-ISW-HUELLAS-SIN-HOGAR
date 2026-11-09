import { z } from "zod";
import { textoOpcionalSchema } from "./fichaValidation.js";

const receptorHistorialSchema = z
  .object({
    id: z.number().int().positive(),
    nombre: z.string(),
  })
  .nullable()
  .optional();

export const ingresoHistorialItemSchema = z.object({
  id: z.number().int().positive(),
  tipo: z.enum(["INGRESO", "REINGRESO"]),
  fechaIngreso: z.string(),
  procedencia: z.string(),
  ubicacionEncontrado: z.string().nullable().optional(),
  estadoSalud: z.string().nullable().optional(),
  receptor: receptorHistorialSchema,
});

const fichaHistorialSchema = z.object({
  id: z.number().int().positive(),
  codigoAnimal: z.string(),
  nombre: z.string().nullable().optional(),
});

export const historialIngresosGlobalResponseSchema = z.object({
  message: z.string(),
  ingresos: z.array(
    ingresoHistorialItemSchema.extend({
      fichaAnimal: fichaHistorialSchema,
    }),
  ),
});

export const historialIngresosResponseSchema = z.object({
  message: z.string(),
  ficha: z.object({
    id: z.number().int().positive(),
    codigoAnimal: z.string(),
    nombre: z.string().nullable().optional(),
    imagenUrl: z.string().nullable().optional(),
  }),
  ingresos: z.array(ingresoHistorialItemSchema),
});

export function validarRespuestaHistorialIngresos(respuesta) {
  const resultado = historialIngresosResponseSchema.safeParse(respuesta);

  if (!resultado.success) {
    throw new Error("El servidor devolvio un historial de ingresos invalido");
  }

  return resultado.data;
}

export function validarRespuestaHistorialIngresosGlobal(respuesta) {
  const resultado = historialIngresosGlobalResponseSchema.safeParse(respuesta);

  if (!resultado.success) {
    throw new Error("El servidor devolvio un historial de ingresos invalido");
  }

  return resultado.data;
}

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
