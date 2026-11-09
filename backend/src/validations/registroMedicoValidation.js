import { z } from "zod";

export const CLASIFICACION_SALUD_VALUES = ["NORMAL", "ENFERMO", "CRITICO"];

// El peso se guarda en Decimal(5,2): 999.99 es el mayor valor representable.
export const PESO_KG_MAXIMO = 999.99;
export const PESO_INICIAL_KG_MAXIMO = 100;
export const PESO_REVALIDADO_KG_MAXIMO = 100;

export const clasificacionSaludSchema = z.enum(CLASIFICACION_SALUD_VALUES, {
  message: "La clasificación de salud debe ser NORMAL, ENFERMO o CRITICO",
});

export const pesoKgSchema = z
  .number({ message: "El peso debe ser un número" })
  .positive("El peso debe ser mayor a 0")
  .max(PESO_KG_MAXIMO, `El peso no puede superar ${PESO_KG_MAXIMO} kg`);

export const pesoInicialKgSchema = z
  .number({ message: "El peso debe ser un número" })
  .positive("El peso debe ser mayor a 0")
  .max(
    PESO_INICIAL_KG_MAXIMO,
    `El peso no puede superar ${PESO_INICIAL_KG_MAXIMO} kg`,
  );

export const observacionInicialSchema = z
  .string({ message: "La observación del estado de salud es obligatoria" })
  .trim()
  .min(1, "La observación del estado de salud es obligatoria")
  .max(1000, "La observación no puede superar los 1000 caracteres");

export const pesoRevalidadoKgSchema = z
  .number({ message: "El peso revalidado debe ser un número" })
  .positive("El peso revalidado debe ser mayor a 0")
  .max(PESO_REVALIDADO_KG_MAXIMO, `El peso revalidado no puede superar ${PESO_REVALIDADO_KG_MAXIMO} kg`);

export const ESTADO_VALIDACION_MEDICA_VALUES = [
  "PROVISIONAL",
  "VALIDACION_PENDIENTE",
  "REVISANDO",
  "REALIZADO",
  "ACTUALIZADO",
];

export const estadoValidacionMedicaSchema = z.enum(
  ESTADO_VALIDACION_MEDICA_VALUES,
  { message: "El estado de validación no es válido" },
);

export const listarRegistrosMedicosQuerySchema = z.object({
  estado: estadoValidacionMedicaSchema.optional(),
});

export const registroMedicoIdParamSchema = z.object({
  id: z.coerce
    .number({ message: "El identificador debe ser un número" })
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser mayor que cero"),
});

export const notificacionIdParamSchema = z.object({
  id: z.coerce
    .number({ message: "El identificador debe ser un número" })
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser mayor que cero"),
});

export const revisionInicialSchema = z.strictObject({
  pesoKg: pesoInicialKgSchema,
  clasificacionSalud: clasificacionSaludSchema,
  observacionInicial: observacionInicialSchema,
  requiereCuarentena: z.boolean({
    message: "Debes indicar si el animal requiere cuarentena",
  }),
});

export const textoOpcionalSchema = z
  .string({ message: "El texto debe ser una cadena" })
  .trim()
  .max(1000, "El texto no puede superar los 1000 caracteres")
  .optional();

export const ESTADO_ENFERMEDAD_VALUES = ["EN_CURSO", "RESUELTO", "CRONICO"];
export const ESTADO_TRATAMIENTO_VALUES = ["EN_CURSO", "RESUELTO", "CRONICO"];
export const EVOLUCION_ESTADO_SALUD_VALUES = ["MEJORANDO", "EMPEORANDO", "ESTABLE"];

export const estadoEnfermedadSchema = z.enum(ESTADO_ENFERMEDAD_VALUES, {
  message: "El estado de la enfermedad debe ser EN_CURSO, RESUELTO o CRONICO",
});

export const estadoTratamientoSchema = z.enum(ESTADO_TRATAMIENTO_VALUES, {
  message: "El estado del tratamiento debe ser EN_CURSO, RESUELTO o CRONICO",
});

export const evolucionEstadoSaludSchema = z.enum(EVOLUCION_ESTADO_SALUD_VALUES, {
  message: "La evolución debe ser MEJORANDO, EMPEORANDO o ESTABLE",
});

export const observacionSeguimientoSchema = z
  .string({ message: "La observación de seguimiento es obligatoria" })
  .trim()
  .min(1, "La observación de seguimiento es obligatoria")
  .max(1000, "La observación de seguimiento no puede superar los 1000 caracteres");

const fechaInicioTratamientoSchema = z
  .string({ message: "La fecha de inicio debe tener formato AAAA-MM-DD" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de inicio debe tener formato AAAA-MM-DD");

const fechaFinTratamientoSchema = z
  .string({ message: "La fecha de fin debe tener formato AAAA-MM-DD" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de fin debe tener formato AAAA-MM-DD")
  .optional();

const atencionSanitariaActualizacionSchema = z.strictObject({
  tipo: z.enum(["vacuna", "tratamiento", "control", "desparasitacion", "esterilizacion"]),
  fechaProgramada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estado: z.enum(["PENDIENTE", "REALIZADA", "CANCELADA"]).optional(),
  fechaRealizacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observaciones: textoOpcionalSchema,
});

const enfermedadNuevaActualizacionSchema = z.strictObject({
  descripcionEnfermedad: z.string().trim().min(1).max(1000),
  tipoEnfermedad: z.string().trim().max(100).optional(),
  estadoEnfermedad: estadoEnfermedadSchema.optional(),
  observacionSeguimiento: textoOpcionalSchema,
});

const tratamientoNuevoActualizacionSchema = z.strictObject({
  descripcionTratamiento: z.string().trim().min(1).max(1000),
  fechaInicio: fechaInicioTratamientoSchema,
  fechaFin: fechaFinTratamientoSchema,
  observaciones: textoOpcionalSchema,
  estadoTratamiento: estadoTratamientoSchema.optional(),
  observacionSeguimiento: textoOpcionalSchema,
});

const seguimientoEnfermedadSchema = z.strictObject({
  enfermedadId: z.coerce
    .number({ message: "El identificador de la enfermedad debe ser un número" })
    .int("El identificador de la enfermedad debe ser un número entero")
    .positive("El identificador de la enfermedad debe ser mayor que cero"),
  estadoEnfermedad: estadoEnfermedadSchema,
  observacionSeguimiento: textoOpcionalSchema,
});

const seguimientoTratamientoSchema = z.strictObject({
  tratamientoId: z.coerce
    .number({ message: "El identificador del tratamiento debe ser un número" })
    .int("El identificador del tratamiento debe ser un número entero")
    .positive("El identificador del tratamiento debe ser mayor que cero"),
  estadoTratamiento: estadoTratamientoSchema,
  observacionSeguimiento: textoOpcionalSchema,
});

export const actualizacionVeterinariaSchema = z.strictObject({
  pesoKg: pesoKgSchema.optional(),
  clasificacionSalud: clasificacionSaludSchema.optional(),
  observacionInicial: observacionInicialSchema.optional(),
  requiereCuarentena: z.boolean({
    message: "Debes indicar si el animal requiere cuarentena",
  }).optional(),
  condiciones: textoOpcionalSchema,
  discapacidades: textoOpcionalSchema,
  lesiones: textoOpcionalSchema,
  descripcionCuidadosEspeciales: textoOpcionalSchema,
  necesidades: textoOpcionalSchema,
  observacionSeguimiento: observacionSeguimientoSchema,
  evolucionEstadoSalud: evolucionEstadoSaludSchema,
  fechaRegistro: z.coerce.date({
    message: "La fecha de registro debe ser una fecha válida",
  }).optional(),
  enfermedades: z.array(enfermedadNuevaActualizacionSchema).min(1).optional(),
  tratamientos: z.array(tratamientoNuevoActualizacionSchema).min(1).optional(),
  seguimientoEnfermedades: z.array(seguimientoEnfermedadSchema).min(1).optional(),
  seguimientoTratamientos: z.array(seguimientoTratamientoSchema).min(1).optional(),
  atencionesSanitarias: z.array(atencionSanitariaActualizacionSchema).min(1).optional(),
});

export const revisionFinalSchema = z.strictObject({
  pesoRevalidadoKg: pesoRevalidadoKgSchema,
  estadoSalud: clasificacionSaludSchema.optional(),
  condiciones: textoOpcionalSchema,
  discapacidades: textoOpcionalSchema,
  lesiones: textoOpcionalSchema,
  descripcionCuidadosEspeciales: textoOpcionalSchema,
  adoptabilidad: z.enum(["ADOPTABLE", "NO_ADOPTABLE"], {
    message: "Debe indicar si el animal es adoptable o no adoptable",
  }),
  enfermedades: z
    .array(
      z.object({
        descripcionEnfermedad: z.string().trim().min(1).max(1000),
        tipoEnfermedad: z.string().trim().max(100).optional(),
      }),
    )
    .min(1)
    .optional(),
  atencionesSanitarias: z
    .array(
      z.object({
        tipo: z.enum(["vacuna", "tratamiento", "control", "desparasitacion", "esterilizacion"]),
        fechaProgramada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        estado: z.enum(["PENDIENTE", "REALIZADA", "CANCELADA"]).optional(),
        fechaRealizacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        observaciones: textoOpcionalSchema,
      }),
    )
    .min(1)
    .optional(),
  tratamientos: z
    .array(
      z.object({
        descripcionTratamiento: z.string().trim().min(1).max(1000),
        fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        observaciones: textoOpcionalSchema,
      }),
    )
    .min(1)
    .optional(),
});
