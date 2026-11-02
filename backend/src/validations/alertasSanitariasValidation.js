import { z } from "zod";

export const TIPOS_ATENCION = [
    "vacuna",
    "tratamiento",
    "control",
    "desparasitacion",
    "esterilizacion",
];

function esFechaValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

    const fecha = new Date(`${valor}T00:00:00.000Z`);

return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
    );
}

export const fechaSanitariaSchema = z.string({
    message: "La fecha debe ser un texto con formato YYYY-MM-DD",
    })
    .refine(esFechaValida, {
    message: "La fecha debe ser valida y tener formato YYYY-MM-DD",
});

export const eventoSanitarioSchema = z.strictObject({
    animalId: z
    .number({
        message: "El identificador del animal debe ser un numero",
    })
    .int("El identificador del animal debe ser entero")
    .positive("El identificador del animal debe ser mayor que cero"),

  tipo: z.enum(TIPOS_ATENCION, {
    message: "Selecciona un tipo de atencion sanitaria valido",
  }),

  fechaProgramada: fechaSanitariaSchema,
});

export const alertasSanitariasSchema = z.strictObject({
  fechaReferencia: fechaSanitariaSchema.optional(),

  diasAnticipacion: z
    .number({
      message:
        "Los dias de anticipacion son obligatorios y deben ser un numero",
    })
    .int("Los dias de anticipacion deben ser enteros")
    .nonnegative("Los dias de anticipacion no pueden ser negativos"),

  eventos: z.array(eventoSanitarioSchema, {
    message: "Los eventos deben enviarse como un arreglo",
  }),
});