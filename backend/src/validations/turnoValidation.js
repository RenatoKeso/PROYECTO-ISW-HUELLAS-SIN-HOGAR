import { z } from "zod";

export const CUPO_MAXIMO_TURNO = 100;

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// El titulo empieza con una letra y despues solo lleva letras (con tildes y ñ),
// espacios, comas o guiones. Asi se rechazan numeros y simbolos.
const REGEX_TITULO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ ,-]*$/;
export const MENSAJE_TITULO =
  "El título debe empezar con una letra y solo puede tener letras, espacios, comas y guiones";

// Capa 1 (forma): aqui solo se revisa que cada dato tenga el tipo y el formato
// correctos. Las reglas que comparan fechas entre si (termino despues del
// inicio, turno futuro, plazo valido) se revisan en turnoService.

function textoObligatorio(campo, maximo) {
  const mensaje = `${campo} es obligatorio`;

  return z
    .string({ message: mensaje })
    .trim()
    // abort: si esta vacio no sigue revisando, asi responde un solo error.
    .min(1, { message: mensaje, abort: true })
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
  titulo: textoObligatorio("El título", 120).regex(REGEX_TITULO, MENSAJE_TITULO),
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

// El dia de la semana de una fecha "AAAA-MM-DD" no depende de la zona horaria,
// por eso se puede revisar en UTC. 1 = lunes.
function esLunes(fecha) {
  return new Date(`${fecha}T12:00:00.000Z`).getUTCDay() === 1;
}

// Una semana se pide por la fecha de su lunes: ?semana=2026-11-16.
const semanaSchema = fechaSchema("La semana").refine(esLunes, {
  message: "La semana se indica con la fecha de su lunes",
});

// GET /turnos/calendario?semana=2026-11-16 (voluntario).
export const calendarioQuerySchema = z.strictObject({
  semana: semanaSchema,
});

// GET /turnos/gestion?semana=2026-11-16 (encargada). Sin semana entrega todos.
export const gestionQuerySchema = z.strictObject({
  semana: semanaSchema.optional(),
});

// GET /turnos/:id/inscritos
export const turnoIdSchema = z.strictObject({
  id: z.coerce
    .number({ message: "El id del turno debe ser un número" })
    .int("El id del turno debe ser un número entero")
    .positive("El id del turno debe ser un número positivo"),
});
