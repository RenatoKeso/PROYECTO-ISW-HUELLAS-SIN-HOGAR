import { z } from "zod";

// Espejo del esquema del backend. Las reglas entre fechas (termino despues del
// inicio, turno futuro, plazo valido) las revisa el servidor y se muestran como mensaje.
export const CUPO_MAXIMO_TURNO = 100;

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const vacioAUndefined = (valor) =>
  typeof valor !== "string" || valor.trim() === "" ? undefined : valor;

export const turnoFormSchema = z.strictObject({
  titulo: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(120, "El título no puede superar los 120 caracteres"),
  descripcion: z.preprocess(
    vacioAUndefined,
    z.string().trim().max(1000, "La descripción no puede superar los 1000 caracteres").optional(),
  ),
  fecha: z.string().min(1, "Elige la fecha del turno"),
  horaInicio: z.string().regex(REGEX_HORA, "Elige la hora de inicio"),
  horaTermino: z.string().regex(REGEX_HORA, "Elige la hora de término"),
  fechaLimiteInscripcion: z.string().min(1, "Elige la fecha límite de inscripción"),
  cupoMaximo: z.coerce
    .number({ message: "El cupo debe ser un número" })
    .int("El cupo debe ser un número entero")
    .min(1, "El turno debe tener al menos 1 cupo")
    .max(CUPO_MAXIMO_TURNO, `El turno no puede tener más de ${CUPO_MAXIMO_TURNO} cupos`),
});
