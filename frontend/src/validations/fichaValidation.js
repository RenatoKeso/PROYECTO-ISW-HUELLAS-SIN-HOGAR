import { z } from "zod";

export const ESPECIE_VALUES = ["PERRO", "GATO", "OTRO"];
export const SEXO_ANIMAL_VALUES = ["MACHO", "HEMBRA", "DESCONOCIDO"];

const vacioAUndefined = (valor) =>
  valor === "" || valor === undefined ? undefined : valor;

const textoLlenable = z
  .string()
  .trim()
  .min(1, "El texto no puede estar vacío")
  .max(255, "El texto no puede superar los 255 caracteres");

export const textoOpcionalSchema = z.preprocess(
  vacioAUndefined,
  textoLlenable.optional(),
);

const edadSchema = z.preprocess(
  vacioAUndefined,
  z
    .coerce.number({ message: "La edad debe ser un número" })
    .int("La edad debe ser un número entero")
    .min(0, "La edad no puede ser negativa")
    .optional(),
);

export const fichaFormSchema = z.strictObject({
  nombre: textoOpcionalSchema,
  sexoAnimal: z.enum(SEXO_ANIMAL_VALUES, {
    message: "El sexo seleccionado no es válido",
  }),
  especie: z.enum(ESPECIE_VALUES, {
    message: "La especie seleccionada no es válida",
  }),
  raza: textoOpcionalSchema,
  edad: edadSchema,
  observaciones: textoOpcionalSchema,
});
