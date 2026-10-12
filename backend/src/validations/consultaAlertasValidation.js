import { z } from "zod";
import {fechaSanitariaSchema,} from "./alertasSanitariasValidation.js";

export const consultaAlertasSchema = z.strictObject({
    fechaReferencia: fechaSanitariaSchema.optional(),

  // Los parámetros de una URL llegan como texto.
diasAnticipacion: z
    .string()
    .regex(
        /^\d+$/,
        "La anticipacion debe ser un entero no negativo"
    )
    .transform(Number)
    .pipe(z.number().int().nonnegative()),
});