import { z } from "zod";
import { fechaSanitariaSchema } from "./alertasSanitariasValidation.js";
import { codigoAnimalSchema } from "./fichaAnimalValidation.js";

export const LIMITE_COMPROBANTE = 2 * 1024 * 1024;

const textoOpcional = z
    .string()
    .trim()
    .max(100)
    .default("");

export const donacionSchema = z
.strictObject({
    destino: z.enum(["REFUGIO", "APADRINAMIENTO"]),

    codigoAnimal: codigoAnimalSchema.optional(),

    monto: z
        .union([
        z.number(),
        z.string().regex(/^\d+$/),
    ])
    .pipe(
        z.coerce
            .number()
            .int()
            .positive()
            .max(99999999999999)
    ),

    medioPago: z.enum(["TRANSFERENCIA", "EFECTIVO"]),

    fechaAporte: fechaSanitariaSchema,

    anonima: z.boolean(),

    nombreDonante: textoOpcional,

    emailDonante: z
        .union([
        z.literal(""),
        z.email(),
    ])
        .transform((valor) => valor.toLowerCase())
        .default(""),

    telefonoDonante: z
        .union([
        z.literal(""),
        z.string().trim().regex(/^\+?[\d ()-]{7,25}$/),
        ])
        .default(""),

    comprobanteNombre: z
    .string()
    .max(180)
    .regex(
        /^[^/\\\r\n"]+\.pdf$/i,
        "El comprobante debe ser un PDF"
    )
    .optional(),

    comprobanteBase64: z
        .string()
        .min(1)
        .max(
        4 * Math.ceil(LIMITE_COMPROBANTE / 3),
        "El PDF puede pesar hasta 2 MB"
    )
    .regex(
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
        )
        .optional(),
})
    .superRefine((datos, contexto) => {
    function error(campo, mensaje) {
        contexto.addIssue({
        code: "custom",
        path: [campo],
        message: mensaje,
    });
}

    if (
        (datos.destino === "APADRINAMIENTO") !==
        Boolean(datos.codigoAnimal)
    ) {
        error(
        "codigoAnimal",
        "Selecciona un animal únicamente para un apadrinamiento"
    );
}

    if (
        datos.anonima &&
    (
        datos.destino !== "REFUGIO" ||
        datos.nombreDonante ||
        datos.emailDonante ||
        datos.telefonoDonante
    )
    ) {
        error(
        "anonima",
        "El aporte anónimo debe ser general y omitir los datos personales del formulario"
    );
}

    if (
        !datos.anonima &&
        datos.nombreDonante.length < 2
    ) {
        error(
        "nombreDonante",
        "Ingresa el nombre de la persona donante"
    );
}

    if (
        datos.destino === "APADRINAMIENTO" &&
        !datos.emailDonante &&
        !datos.telefonoDonante
    ) {
        error(
        "emailDonante",
        "Para apadrinar, ingresa correo electrónico o teléfono"
    );
}

    const tieneArchivo = Boolean(
        datos.comprobanteBase64
    );

    if (
        tieneArchivo !== Boolean(datos.comprobanteNombre)
    ) {
        error(
        "comprobanteBase64",
        "Adjunta el archivo y su nombre"
    );
}

    if (
        (datos.medioPago === "TRANSFERENCIA") !==
        tieneArchivo
    ) {
        error(
        "comprobanteBase64",
        "Adjunta un comprobante PDF para una transferencia"
        );
    }
});

export const folioDonacionSchema = z.strictObject({
    folio: z.uuid(),
});

export const revisionDonacionSchema = z
.strictObject({
    estado: z.enum(["CONFIRMADA", "RECHAZADA"]),

    motivoRechazo: z
        .string()
        .trim()
        .max(500)
        .default(""),
})
    .superRefine((datos, contexto) => {
    if (
        (datos.estado === "RECHAZADA") !==
        Boolean(datos.motivoRechazo)
    ) {
        contexto.addIssue({
        code: "custom",
        path: ["motivoRechazo"],
        message:
            "Indica un motivo únicamente al rechazar la donación",
        });
        }
    });

export const filtrosDonacionSchema = z
    .strictObject({
    desde: fechaSanitariaSchema.optional(),
    hasta: fechaSanitariaSchema.optional(),

    estado: z
        .enum(["PENDIENTE", "CONFIRMADA", "RECHAZADA"])
        .optional(),

    destino: z
        .enum(["REFUGIO", "APADRINAMIENTO"])
        .optional(),

    codigoAnimal: codigoAnimalSchema.optional(),

    donante: z.string().trim().max(100).optional(),

    animal: z.string().trim().max(100).optional(),

    pagina: z.coerce
    .number()
    .int()
    .positive()
    .max(1000000)
    .default(1),
})
    .refine(
    (datos) =>
        !datos.desde ||
        !datos.hasta ||
        datos.desde <= datos.hasta,
    {
        path: ["hasta"],
        message:
        "La fecha final debe ser igual o posterior a la inicial",
    }
);

export const busquedaDonacionSchema = z.strictObject({
    nombre: z.string().trim().max(100).default(""),

    pagina: z.coerce
    .number()
    .int()
    .positive()
    .max(1000000)
    .default(1),
});