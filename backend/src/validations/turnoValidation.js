import { z } from "zod";

export const CUPO_MAXIMO_TURNO = 100;

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Capa 1 (forma): aqui solo se revisa que cada dato tenga el tipo y el formato
// correctos. Las reglas que comparan fechas entre si (termino despues del
// inicio, turno futuro, plazo valido) se revisan en turnoService.

function textoObligatorio(campo, maximo) {
  const mensaje = `${campo} es obligatorio`;

  return z
    .string({ message: mensaje })
    .trim()
    .min(1, mensaje)
    .max(maximo, `${campo} no puede superar los ${maximo} caracteres`);
}

function fechaSchema(campo) {
  return z.iso.date({ message: `${campo} debe tener el formato AAAA-MM-DD` });
}

function horaSchema(campo) {
  return z
    .string({ message: `${campo} es obligatoria` })
    .regex(REGEX_HORA, `${campo} debe tener el formato HH:MM`);
}

// La encargada escribe fechas y horas de Chile. El servicio las convierte a
// instantes UTC antes de guardarlas.
export const turnoCreateSchema = z.strictObject({
  titulo: textoObligatorio("El título", 120),
  descripcion: z
    .string({ message: "La descripción debe ser un texto" })
    .trim()
    .min(1, "La descripción no puede estar vacía")
    .max(1000, "La descripción no puede superar los 1000 caracteres")
    .optional(),
  fecha: fechaSchema("La fecha del turno"),
  horaInicio: horaSchema("La hora de inicio"),
  horaTermino: horaSchema("La hora de término"),
  fechaLimiteInscripcion: fechaSchema("La fecha límite de inscripción"),
  cupoMaximo: z
    .number({ message: "El cupo máximo debe ser un número" })
    .int("El cupo máximo debe ser un número entero")
    .min(1, "El turno debe tener al menos 1 cupo")
    .max(CUPO_MAXIMO_TURNO, `El turno no puede tener más de ${CUPO_MAXIMO_TURNO} cupos`),
});