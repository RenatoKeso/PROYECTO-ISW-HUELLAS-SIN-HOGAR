import { z } from "zod";

// Capa 1 (forma): solo se revisa el tipo de los datos. Que el turno exista, tenga
// cupos o se solape con otro se revisa en inscripcionService.
// El voluntario nunca viaja en el cuerpo: se toma de la sesion.
export const inscripcionCreateSchema = z.strictObject({
  turnoId: z
    .number({ message: "El turno es obligatorio" })
    .int("El turno debe ser un número entero")
    .positive("El turno debe ser un número positivo"),
});

export const ESTADOS_INSCRIPCION = ["ACTIVA", "CANCELADA"];

// Filtro opcional de "mis inscripciones": ?estado=ACTIVA o ?estado=CANCELADA.
export const misInscripcionesQuerySchema = z.strictObject({
  estado: z
    .enum(ESTADOS_INSCRIPCION, { message: "El estado debe ser ACTIVA o CANCELADA" })
    .optional(),
});

// El id que llega en la URL es texto: se convierte a entero positivo.
export const inscripcionIdSchema = z.strictObject({
  id: z.coerce
    .number({ message: "El id de la inscripción debe ser un número" })
    .int("El id de la inscripción debe ser un número entero")
    .positive("El id de la inscripción debe ser un número positivo"),
});

// Cambiar una inscripcion a otro turno: solo se manda el turno nuevo.
export const inscripcionUpdateSchema = z.strictObject({
  turnoId: z
    .number({ message: "El turno nuevo es obligatorio" })
    .int("El turno debe ser un número entero")
    .positive("El turno debe ser un número positivo"),
});

