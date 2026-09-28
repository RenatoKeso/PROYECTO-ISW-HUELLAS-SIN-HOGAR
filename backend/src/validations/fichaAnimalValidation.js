import { z } from "zod";

export const ESPECIE_VALUES = ["PERRO", "GATO", "OTRO"];
export const SEXO_ANIMAL_VALUES = ["MACHO", "HEMBRA", "DESCONOCIDO"];
export const ESTADO_ESTADIA_ANIMAL_VALUES = [
  "ACTIVO",
  "ADOPTADO",
  "ESPERA_ADOPCION",
  "EGRESADO",
  "FALLECIDO",
  "TRANSFERIDO",
];

export const optionalTextSchema = z
  .string()
  .trim()
  .min(1, "El texto no puede estar vacío")
  .max(255, "El texto no puede superar los 255 caracteres");

export const especieSchema = z.enum(ESPECIE_VALUES, {
  message: "La especie seleccionada no es válida",
});

export const sexoAnimalSchema = z.enum(SEXO_ANIMAL_VALUES, {
  message: "El sexo seleccionado no es válido",
});

export const estadoEstadiaAnimalSchema = z.enum(ESTADO_ESTADIA_ANIMAL_VALUES, {
  message: "El estado de estadía seleccionado no es válido",
});

export const edadSchema = z
  .number({ message: "La edad debe ser un número" })
  .int("La edad debe ser un número entero")
  .min(0, "La edad no puede ser negativa");

export const codigoAnimalSchema = z
  .string()
  .trim()
  .regex(/^anim-\d+$/, "El código debe tener el formato anim-001");

export const fichaAnimalCreateSchema = z.strictObject({
  nombre: optionalTextSchema.optional(),
  sexoAnimal: sexoAnimalSchema,
  especie: especieSchema,
  raza: optionalTextSchema.optional(),
  edad: edadSchema.optional(),
  estadoEstadia: estadoEstadiaAnimalSchema.default("ACTIVO"),
  observaciones: optionalTextSchema.optional(),
});

export const fichaAnimalUpdateSchema = z
  .strictObject({
    nombre: optionalTextSchema.optional(),
    sexoAnimal: sexoAnimalSchema.optional(),
    especie: especieSchema.optional(),
    raza: optionalTextSchema.optional(),
    edad: edadSchema.optional(),
    estadoEstadia: estadoEstadiaAnimalSchema.optional(),
    observaciones: optionalTextSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "La actualización debe incluir al menos un campo",
  });

export const fichaCreateSchema = fichaAnimalCreateSchema.omit({
  estadoEstadia: true,
});

export const fichaIdParamSchema = z.object({
  id: z.coerce
    .number({ message: "El identificador debe ser un número" })
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser mayor que cero"),
});
