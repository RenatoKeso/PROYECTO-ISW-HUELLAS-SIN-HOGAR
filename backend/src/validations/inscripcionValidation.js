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