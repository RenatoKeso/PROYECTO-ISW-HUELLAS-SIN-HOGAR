import { z } from "zod";

export const TIPOS_PLAN = [
    "vacuna",
    "tratamiento",
    "control",
    "desparasitacion",
    "esterilizacion",
];

const fechaSchema = z.string().refine((valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

const fecha = new Date(`${valor}T00:00:00.000Z`);

    return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
    );
}, "Ingresa una fecha valida");

export const consultaAlertasFormSchema = z.object({
    fechaReferencia: z
    .union([z.literal(""), fechaSchema])
    .transform((valor) => valor || undefined),

    diasAnticipacion: z
    .string()
    .trim()
    .regex(
        /^\d+$/,
        "Ingresa dias de anticipacion enteros no negativos"
    )
    .transform(Number)
    .pipe(z.number().int().nonnegative()),
});

export const respuestaAlertasPlanSchema = z.object({
    fechaReferencia: fechaSchema,
    diasAnticipacion: z.number().int().nonnegative(),

alertas: z.array(
    z.object({
        atencionId: z.number().int().positive(),
        animalId: z.number().int().positive(),
        codigoAnimal: z.string().min(1),
        nombreAnimal: z.string().nullable(),
        tipo: z.enum(TIPOS_PLAN),
        fechaProgramada: fechaSchema,
        estado: z.enum(["vencido", "proximo"]),
        diasRestantes: z.number().int(),
        })
    ),
});