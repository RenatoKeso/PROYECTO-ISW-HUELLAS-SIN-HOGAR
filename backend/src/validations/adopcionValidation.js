import { z } from "zod";

export const TIPO_VIVIENDA_VALUES = ["CASA", "DEPARTAMENTO", "OTRO"];

export const ESTADO_POSTULACION_VALUES = [
  "EN_REVISION",
  "APROBADA",
  "RECHAZADA",
  "CERRADA",
  "ENTREGADA",
];

// Al revisar, la encargada solo puede aprobar o rechazar.
export const DECISION_POSTULACION_VALUES = ["APROBADA", "RECHAZADA"];

export const TIPO_VISITA_VALUES = ["PRIMERA_VISITA", "VISITA_HOGAR"];
export const RESULTADO_VISITA_VALUES = ["FAVORABLE", "DESFAVORABLE"];
export const MOTIVO_OMISION_VALUES = [
  "FALTA_ESPACIO_REFUGIO",
  "POSTULANTE_CONOCIDO",
  "DISTANCIA",
  "SIN_PERSONAL_DISPONIBLE",
  "OTRO",
];

// El refugio esta en Chile: "hoy" y "el dia de una fecha" se calculan con la
// hora de Chile
const ZONA_HORARIA = "America/Santiago";

// Devuelve el dia de una fecha en Chile, como texto "AAAA-MM-DD".
export function diaEnChile(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(fecha);
}

// Fecha sin hora ("AAAA-MM-DD") que no puede ser posterior a hoy.
// Se guarda como medianoche UTC, igual que las otras fechas sin hora del proyecto.
const fechaNoFuturaSchema = z.iso
  .date({ message: "La fecha debe tener el formato AAAA-MM-DD" })
  .refine((valor) => valor <= diaEnChile(), {
    message: "La fecha no puede ser posterior a hoy",
  })
  .transform((valor) => new Date(`${valor}T00:00:00.000Z`));

const idSchema = z
  .number({ message: "El identificador debe ser un número" })
  .int("El identificador debe ser un número entero")
  .positive("El identificador debe ser mayor que cero");

// "genero" ajusta el mensaje: "El nombre es obligatorio" / "La observación es obligatoria".
function textoObligatorio(campo, { maximo = 255, genero = "o" } = {}) {
  const mensaje = `${campo} es obligatori${genero}`;

  return z
    .string({ message: mensaje })
    .trim()
    .min(1, mensaje)
    .max(maximo, `${campo} no puede superar los ${maximo} caracteres`);
}

const textoOpcional = z
  .string()
  .trim()
  .min(1, "El texto no puede estar vacío")
  .max(255, "El texto no puede superar los 255 caracteres");

// Acepta "12.345.678-9" o "12345678-9" y siempre lo guarda como "12345678-9".
// Guardarlo igual es lo que permite encontrar las devoluciones anteriores del postulante.
export const rutSchema = z
  .string({ message: "El RUT es obligatorio" })
  .trim()
  .transform((valor) => valor.replace(/\./g, "").toUpperCase())
  .pipe(
    z.string().regex(/^\d{7,8}-[\dK]$/, "El RUT debe tener el formato 12345678-9"),
  );

// Acepta espacios ("9 1234 5678") y los quita antes de guardar.
export const telefonoSchema = z
  .string({ message: "El teléfono es obligatorio" })
  .trim()
  .transform((valor) => valor.replace(/\s/g, ""))
  .pipe(
    z.string().regex(/^\+?\d{8,12}$/, "El teléfono debe tener entre 8 y 12 dígitos"),
  );

// Formulario publico que llena la persona que quiere adoptar.
export const postulacionCreateSchema = z.strictObject({
  fichaAnimalId: idSchema,
  nombrePostulante: textoObligatorio("El nombre"),
  rutPostulante: rutSchema,
  telefonoPostulante: telefonoSchema,
  emailPostulante: z
    .email("El correo no es válido")
    .max(255, "El correo no puede superar los 255 caracteres")
    .optional(),
  tipoVivienda: z.enum(TIPO_VIVIENDA_VALUES, {
    message: "El tipo de vivienda no es válido",
  }),
  otrasMascotas: textoOpcional.optional(),
  disponibilidadTiempo: textoObligatorio("La disponibilidad de tiempo", { genero: "a" }),
});

export const postulacionIdParamSchema = z.object({
  id: z.coerce
    .number({ message: "El identificador debe ser un número" })
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser mayor que cero"),
});

export const animalIdParamSchema = postulacionIdParamSchema;

export const listarPostulacionesQuerySchema = z.strictObject({
  estado: z
    .enum(ESTADO_POSTULACION_VALUES, { message: "El estado indicado no es válido" })
    .optional(),
});

export const resolverPostulacionSchema = z.strictObject({
  decision: z.enum(DECISION_POSTULACION_VALUES, {
    message: "La decisión debe ser APROBADA o RECHAZADA",
  }),
  observaciones: textoObligatorio("La observación", { maximo: 1000, genero: "a" }).optional(),
});

export const registrarVisitaSchema = z.strictObject({
  tipo: z.enum(TIPO_VISITA_VALUES, { message: "El tipo de visita no es válido" }),
  fechaVisita: fechaNoFuturaSchema,
  resultado: z.enum(RESULTADO_VISITA_VALUES, {
    message: "El resultado debe ser FAVORABLE o DESFAVORABLE",
  }),
  observaciones: textoObligatorio("La observación", { maximo: 1000, genero: "a" }).optional(),
});

export const omitirVisitaHogarSchema = z
  .strictObject({
    motivo: z.enum(MOTIVO_OMISION_VALUES, { message: "Selecciona un motivo de la lista" }),
    observacion: textoObligatorio("La observación", { maximo: 1000, genero: "a" }).optional(),
  })
  .refine((datos) => datos.motivo !== "OTRO" || datos.observacion, {
    message: "Si el motivo es OTRO, explícalo en la observación",
    path: ["observacion"],
  });

export const entregaSchema = z.strictObject({
  fechaEntrega: fechaNoFuturaSchema,
  documentacionEntregada: textoObligatorio("La documentación entregada", {
    maximo: 1000,
    genero: "a",
  }),
});