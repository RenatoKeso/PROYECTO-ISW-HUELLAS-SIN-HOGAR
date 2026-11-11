import { z } from "zod";

export const ESTADOS_VALIDACION_MEDICA = [
  "PROVISIONAL",
  "VALIDACION_PENDIENTE",
  "REVISANDO",
  "REALIZADO",
  "ACTUALIZADO",
];

export const CLASIFICACIONES_SALUD = ["NORMAL", "ENFERMO", "CRITICO"];

export const ESTADOS_ENFERMEDAD = ["EN_CURSO", "RESUELTO", "CRONICO"];

export const ESTADOS_TRATAMIENTO = ["EN_CURSO", "RESUELTO", "CRONICO"];

export const EVOLUCIONES_SALUD = ["MEJORANDO", "EMPEORANDO", "ESTABLE"];

export const TIPOS_ATENCION_MEDICA = [
  "vacuna",
  "tratamiento",
  "control",
  "desparasitacion",
  "esterilizacion",
];

export const ADOPTABILIDADES = ["ADOPTABLE", "NO_ADOPTABLE"];

export const PESO_KG_MAXIMO = 999.99;

export const PESO_INICIAL_KG_MAXIMO = 100;

export const PESO_REVALIDADO_KG_MAXIMO = 100;

const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const fechaOpcionalSchema = z.preprocess(
  (valor) => (valor === "" || valor === null ? undefined : valor),
  fechaSchema.optional(),
);

const textoOpcional = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((valor) => (valor === "" ? undefined : valor));

function normalizarBooleano(valor) {
  if (typeof valor === "boolean") return valor;
  if (valor === "true") return true;
  if (valor === "false") return false;
  return valor;
}

const booleanoFormulario = z.preprocess(normalizarBooleano, z.boolean());

const booleanoOpcionalFormulario = z.preprocess(
  (valor) =>
    valor === "" || valor === null || valor === undefined
      ? undefined
      : normalizarBooleano(valor),
  z.boolean().optional(),
);

const numeroOpcionalFormulario = z.preprocess(
  (valor) => (valor === "" || valor === null ? undefined : valor),
  z.coerce.number().positive().max(PESO_KG_MAXIMO).optional(),
);

const clasificacionOpcionalFormulario = z.preprocess(
  (valor) => (valor === "" || valor === null ? undefined : valor),
  z.enum(CLASIFICACIONES_SALUD).optional(),
);

const observacionInicialOpcional = z.preprocess(
  (valor) => (valor === "" || valor === null ? undefined : valor),
  z.string().trim().min(1).max(1000).optional(),
);

function filasVacias(items) {
  return items.filter((item) =>
    Object.values(item).some((valor) => valor !== "" && valor !== undefined && valor !== null),
  );
}

export const revisionInicialFormSchema = z.strictObject({
  pesoKg: z.coerce.number().positive().max(PESO_INICIAL_KG_MAXIMO),
  clasificacionSalud: z.enum(CLASIFICACIONES_SALUD),
  observacionInicial: z.string().trim().min(1).max(1000),
  requiereCuarentena: booleanoFormulario,
});

export const revisionFinalFormSchema = z.strictObject({
  pesoRevalidadoKg: z.coerce.number().positive().max(PESO_REVALIDADO_KG_MAXIMO),
  estadoSalud: clasificacionOpcionalFormulario,
  condiciones: textoOpcional,
  discapacidades: textoOpcional,
  lesiones: textoOpcional,
  descripcionCuidadosEspeciales: textoOpcional,
  adoptabilidad: z.enum(ADOPTABILIDADES),
  enfermedades: z
    .array(
      z.strictObject({
        descripcionEnfermedad: z.string().trim().min(1).max(1000),
        tipoEnfermedad: z.string().trim().max(100).optional(),
      }),
    )
    .optional(),
  tratamientos: z
    .array(
      z.strictObject({
        descripcionTratamiento: z.string().trim().min(1).max(1000),
        fechaInicio: fechaSchema,
        fechaFin: fechaOpcionalSchema,
        observaciones: textoOpcional,
      }),
    )
    .optional(),
  atencionesSanitarias: z
    .array(
      z.strictObject({
        tipo: z.enum(TIPOS_ATENCION_MEDICA),
        fechaProgramada: fechaSchema,
        estado: z.enum(["PENDIENTE", "REALIZADA", "CANCELADA"]).optional(),
        fechaRealizacion: fechaOpcionalSchema,
        observaciones: textoOpcional,
      }),
    )
    .optional(),
});

export const actualizacionVeterinariaFormSchema = z.strictObject({
  pesoKg: numeroOpcionalFormulario,
  clasificacionSalud: clasificacionOpcionalFormulario,
  observacionInicial: observacionInicialOpcional,
  requiereCuarentena: booleanoOpcionalFormulario,
  condiciones: textoOpcional,
  discapacidades: textoOpcional,
  lesiones: textoOpcional,
  descripcionCuidadosEspeciales: textoOpcional,
  necesidades: textoOpcional,
  observacionSeguimiento: z.string().trim().min(1).max(1000),
  evolucionEstadoSalud: z.enum(EVOLUCIONES_SALUD),
  fechaRegistro: fechaOpcionalSchema,
  enfermedades: z
    .array(
      z.strictObject({
        descripcionEnfermedad: z.string().trim().min(1).max(1000),
        tipoEnfermedad: z.string().trim().max(100).optional(),
        estadoEnfermedad: z.enum(ESTADOS_ENFERMEDAD).optional(),
        observacionSeguimiento: textoOpcional,
      }),
    )
    .optional(),
  tratamientos: z
    .array(
      z.strictObject({
        descripcionTratamiento: z.string().trim().min(1).max(1000),
        fechaInicio: fechaSchema,
        fechaFin: fechaOpcionalSchema,
        observaciones: textoOpcional,
        estadoTratamiento: z.enum(ESTADOS_TRATAMIENTO).optional(),
        observacionSeguimiento: textoOpcional,
      }),
    )
    .optional(),
  seguimientoEnfermedades: z
    .array(
      z.strictObject({
        enfermedadId: z.coerce.number().int().positive(),
        estadoEnfermedad: z.enum(ESTADOS_ENFERMEDAD),
        observacionSeguimiento: textoOpcional,
      }),
    )
    .optional(),
  seguimientoTratamientos: z
    .array(
      z.strictObject({
        tratamientoId: z.coerce.number().int().positive(),
        estadoTratamiento: z.enum(ESTADOS_TRATAMIENTO),
        observacionSeguimiento: textoOpcional,
      }),
    )
    .optional(),
  atencionesSanitarias: z
    .array(
      z.strictObject({
        tipo: z.enum(TIPOS_ATENCION_MEDICA),
        fechaProgramada: fechaSchema,
        estado: z.enum(["PENDIENTE", "REALIZADA", "CANCELADA"]).optional(),
        fechaRealizacion: fechaOpcionalSchema,
        observaciones: textoOpcional,
      }),
    )
    .optional(),
});

export const animalMedicoSchema = z.object({
  id: z.number().int().positive(),
  codigoAnimal: z.string(),
  nombre: z.string().nullable().optional(),
  estadoEstadia: z.string(),
  estadoAdopcion: z.string().nullable().optional(),
});

export const revisionInicialMedicaSchema = z
  .object({
    id: z.number().int().positive(),
    estadoRevisionInicial: z.string(),
    fechaActualizacion: z.string().nullable().optional(),
    prioridadAtencion: z.number().nullable().optional(),
  })
  .nullable()
  .optional();

export const revisionCompletaMedicaSchema = z
  .object({
    id: z.number().int().positive(),
    peso: z.coerce.number().nullable().optional(),
    descripcionCuidadosEspeciales: z.string().nullable().optional(),
    descripcionCondicionMedica: z.string().nullable().optional(),
    discapacidades: z.string().nullable().optional(),
    lesiones: z.string().nullable().optional(),
    estadoSalud: z.enum(CLASIFICACIONES_SALUD).nullable().optional(),
  })
  .nullable()
  .optional();

export const enfermedadMedicaSchema = z.object({
  id: z.number().int().positive(),
  descripcionEnfermedad: z.string(),
  tipoEnfermedad: z.string().nullable().optional(),
});

export const tratamientoMedicoSchema = z.object({
  id: z.number().int().positive(),
  descripcionTratamiento: z.string(),
  fechaInicio: z.string(),
  fechaFin: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

export const atencionMedicaSchema = z.object({
  id: z.number().int().positive(),
  tipo: z.string(),
  fechaProgramada: z.string(),
  estado: z.string(),
  fechaRealizacion: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

export const registroMedicoSchema = z.object({
  id: z.number().int().positive(),
  animalId: z.number().int().positive(),
  ingresoAnimalId: z.number().int().positive().nullable().optional(),
  estadoValidacion: z.enum(ESTADOS_VALIDACION_MEDICA),
  estadoPrevioRevision: z.enum(ESTADOS_VALIDACION_MEDICA).nullable().optional(),
  createdAt: z.string(),
  pesoKg: z.coerce.number().nullable().optional(),
  clasificacionSalud: z.enum(CLASIFICACIONES_SALUD).nullable().optional(),
  observacionInicial: z.string().nullable().optional(),
  requiereCuarentena: z.boolean().nullable().optional(),
  fechaRevisionInicial: z.string().nullable().optional(),
  animal: animalMedicoSchema.optional(),
  revisionInicial: revisionInicialMedicaSchema,
  revisionCompleta: revisionCompletaMedicaSchema,
  enfermedades: z.array(enfermedadMedicaSchema).optional(),
  tratamientos: z.array(tratamientoMedicoSchema).optional(),
  atencionesSanitarias: z.array(atencionMedicaSchema).optional(),
});

export const registrosMedicosResponseSchema = z.object({
  message: z.string(),
  registros: z.array(registroMedicoSchema),
});

export const registroMedicoResponseSchema = z.object({
  message: z.string(),
  registro: registroMedicoSchema,
});

export const revisionInicialResponseSchema = z.object({
  message: z.string(),
  registroMedico: registroMedicoSchema.extend({
    prioridadAtencion: z.number().nullable().optional(),
  }),
});

export const revisionFinalResponseSchema = z.object({
  message: z.string(),
  revisionFinal: z.object({}).passthrough(),
  ficha: z.object({}).passthrough(),
  registroMedico: registroMedicoSchema,
});

export const actualizacionResponseSchema = z.object({
  message: z.string(),
  registroMedico: registroMedicoSchema,
  version: z.number().int(),
  historial: z.object({}).passthrough(),
  seguimiento: z.object({}).passthrough(),
  revisionCompleta: z.object({}).passthrough().optional(),
});

export const historialMedicoItemSchema = z.object({
  id: z.number().int().positive(),
  version: z.number().int().positive(),
  estadoOrigen: z.enum(ESTADOS_VALIDACION_MEDICA),
  peso: z.coerce.number().nullable().optional(),
  clasificacionSalud: z.enum(CLASIFICACIONES_SALUD).nullable().optional(),
  descripcionCuidadosEspeciales: z.string().nullable().optional(),
  descripcionCondicionMedica: z.string().nullable().optional(),
  descripcionTratamientos: z.string().nullable().optional(),
  descripcionEnfermedades: z.string().nullable().optional(),
  observacionSeguimiento: z.string().nullable().optional(),
  fecha: z.string(),
  actualizadoPor: z.object({}).passthrough().optional(),
});

export const historialMedicoResponseSchema = z.object({
  message: z.string(),
  historial: z.array(historialMedicoItemSchema),
});

export const actualizacionMedicaItemSchema = z.object({
  id: z.number().int().positive(),
  registroMedicoId: z.number().int().positive(),
  version: z.number().int().positive(),
  estadoOrigen: z.enum(ESTADOS_VALIDACION_MEDICA),
  peso: z.coerce.number().nullable().optional(),
  clasificacionSalud: z.enum(CLASIFICACIONES_SALUD).nullable().optional(),
  descripcionCuidadosEspeciales: z.string().nullable().optional(),
  descripcionCondicionMedica: z.string().nullable().optional(),
  descripcionTratamientos: z.string().nullable().optional(),
  descripcionEnfermedades: z.string().nullable().optional(),
  observacionSeguimiento: z.string().nullable().optional(),
  fecha: z.string(),
  actualizadoPor: z.object({}).passthrough().optional(),
  registroMedico: z
    .object({
      id: z.number().int().positive(),
      animal: animalMedicoSchema.optional(),
    })
    .passthrough(),
});

export const actualizacionesMedicasResponseSchema = z.object({
  message: z.string(),
  actualizaciones: z.array(actualizacionMedicaItemSchema),
});

export const seguimientoMedicoItemSchema = z.object({
  id: z.number().int().positive(),
  fechaRegistro: z.string(),
  peso: z.coerce.number().nullable().optional(),
  observacionSeguimiento: z.string(),
  necesidades: z.string().nullable().optional(),
  estadoSalud: z.enum(CLASIFICACIONES_SALUD),
  evolucionEstadoSalud: z.enum(EVOLUCIONES_SALUD),
  createdBy: z.object({}).passthrough().nullable().optional(),
  seguimientosEnfermedad: z.array(z.object({}).passthrough()).optional(),
  seguimientosTratamiento: z.array(z.object({}).passthrough()).optional(),
});

export const seguimientosResponseSchema = z.object({
  message: z.string(),
  seguimientos: z.array(seguimientoMedicoItemSchema),
});

export const notificacionMedicaSchema = z.object({
  id: z.number().int().positive(),
  destinatarioId: z.number().int().positive(),
  tipo: z.string(),
  titulo: z.string(),
  mensaje: z.string(),
  registroMedicoId: z.number().int().positive().nullable().optional(),
  leida: z.boolean(),
  createdAt: z.string(),
});

export const notificacionesResponseSchema = z.object({
  message: z.string(),
  notificaciones: z.array(notificacionMedicaSchema),
});

export const notificacionLeidaResponseSchema = z.object({
  message: z.string(),
  notificacion: z.object({
    id: z.number().int().positive(),
    leida: z.boolean(),
  }),
});

export { filasVacias };
