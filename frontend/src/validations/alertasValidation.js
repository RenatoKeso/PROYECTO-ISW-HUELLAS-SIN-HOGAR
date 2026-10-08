import { z } from "zod";

export const TIPOS_ATENCION = [
    "vacuna",
    "tratamiento",
    "control",
];

const fechaSchema = z.string().refine(
    (valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

    const fecha = new Date(`${valor}T00:00:00.000Z`);

    return (
        !Number.isNaN(fecha.getTime()) &&
        fecha.toISOString().slice(0, 10) === valor
    );
    },
{
    message: "Ingresa una fecha valida con formato YYYY-MM-DD",
},
);

// Primero rechaza campos vacíos; después convierte y valida el número.
function enteroFormulario(minimo, mensaje) {
return z.string().trim().min(1, "Este campo es obligatorio").transform(Number).pipe(z
        .number()
        .int("Ingresa un numero entero")
        .min(minimo, mensaje),
    );
}

export const alertasFormSchema = z.object({
fechaReferencia: z
    .union([z.literal(""), fechaSchema])
    .transform((valor) => (valor === "" ? undefined : valor)),

diasAnticipacion: enteroFormulario(
    0,
    "La anticipacion no puede ser negativa",
),

eventos: z.array(
    z.object({
        animalId: enteroFormulario(
        1,
        "El identificador debe ser mayor que cero",
    ),

        tipo: z.enum(TIPOS_ATENCION, {
        message: "Selecciona un tipo de atencion valido",
        }),

        fechaProgramada: fechaSchema,
    }),
),
});

// Comprueba también la respuesta recibida desde el backend.
export const respuestaAlertasSchema = z.object({
    fechaReferencia: fechaSchema,
    diasAnticipacion: z.number().int().nonnegative(),

alertas: z.array(
    z.object({
        animalId: z.number().int().positive(),
        tipo: z.enum(TIPOS_ATENCION),
        fechaProgramada: fechaSchema,
        estado: z.enum(["vencido", "proximo"]),
        diasRestantes: z.number().int(),
    }),
),
});