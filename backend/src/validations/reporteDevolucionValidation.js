import { z } from "zod";
import { diaEnChile } from "./adopcionValidation.js";

const fechaSchema = z.iso
  .date({ message: "La fecha debe tener el formato AAAA-MM-DD" })
  .refine((valor) => valor <= diaEnChile(), {
     message: "La fecha no puede ser futura",
   })
  .transform((value) => new Date(value));

export const reporteDevolucionSchema = z
  .strictObject({
    fechaDesde: fechaSchema,
    fechaHasta: fechaSchema,
  })
  .refine((data) => data.fechaDesde <= data.fechaHasta, {
    message: "La fecha de inicio debe ser anterior o igual a la fecha de término",
    path: ["fechaHasta"],
  });





