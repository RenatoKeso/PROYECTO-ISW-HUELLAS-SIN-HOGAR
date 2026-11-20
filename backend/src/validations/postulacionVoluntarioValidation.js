import { z } from "zod";
import { telefonoSchema } from "./adopcionValidation.js";

export const DIA_SEMANA_VALUES = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
];

export const HABILIDAD_VOLUNTARIO_VALUES = [
  "CUIDADO_ANIMALES",
  "LIMPIEZA",
  "TRANSPORTE",
  "APOYO_VETERINARIO",
  "DIFUSION_REDES",
  "EVENTOS",
  "OTRA",
];

export const ESTADO_POSTULACION_VOLUNTARIO_VALUES = ["EN_REVISION", "ACEPTADA", "RECHAZADA"];

export const DECISION_POSTULACION_VOLUNTARIO_VALUES = ["ACEPTADA", "RECHAZADA"];

export const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;

export const postulacionVoluntarioSchema = z
  .strictObject({
    nombre: z
      .string({ message: "El nombre es obligatorio" })
      .trim()
      .min(1, "El nombre es obligatorio")
      .min(3, "El nombre debe tener al menos 3 letras")
      .max(255, "El nombre puede tener máximo 255 caracteres")
      .regex(SOLO_LETRAS, "El nombre solo puede tener letras"),
    email: z
      .email("El correo no es válido")
      .max(255, "El correo puede tener máximo 255 caracteres")
      .transform((valor) => valor.toLowerCase()),
    telefono: telefonoSchema,
    diasDisponibles: z
      .array(z.enum(DIA_SEMANA_VALUES, { message: "Elige días de la lista" }), {
        message: "Elige al menos un día",
      })
      .min(1, "Elige al menos un día"),
    motivacion: z
      .string({ message: "Cuéntanos por qué quieres ser voluntario" })
      .trim()
      .min(1, "Cuéntanos por qué quieres ser voluntario")
      .min(20, "Cuéntanos un poco más (mínimo 20 caracteres)")
      .max(1000, "La motivación puede tener máximo 1000 caracteres"),
    habilidades: z
      .array(z.enum(HABILIDAD_VOLUNTARIO_VALUES, { message: "Elige habilidades de la lista" }), {
        message: "Elige al menos una habilidad",
      })
      .min(1, "Elige al menos una habilidad"),
    otraHabilidad: z
      .string()
      .trim()
      .min(1, "Escribe cuál es tu otra habilidad")
      .max(255, "La otra habilidad puede tener máximo 255 caracteres")
      .regex(SOLO_LETRAS, "La otra habilidad solo puede tener letras")
      .optional(),
    codigo: z
      .string({ message: "Escribe el código que te llegó al correo" })
      .regex(/^\d{6}$/, "El código debe tener 6 números"),
    curriculumNombre: z
      .string()
      .trim()
      .max(255, "El nombre del archivo es muy largo")
      .regex(/\.pdf$/i, "El currículum debe ser un archivo PDF")
      .optional(),
    curriculumBase64: z
      .string()
      .max(2800000, "El currículum puede pesar máximo 2 MB")
      .optional(),
  })
  
  .refine((datos) => !datos.habilidades.includes("OTRA") || datos.otraHabilidad, {
    message: "Si eliges OTRA, escribe cuál es tu habilidad",
    path: ["otraHabilidad"],
  })
  .refine((datos) => Boolean(datos.curriculumNombre) === Boolean(datos.curriculumBase64), {
    message: "Falta el archivo del currículum",
    path: ["curriculumBase64"],
  });

 export const pedirCodigoSchema = z.strictObject({
  email: z
   .email("El correo no es válido")
   .max(255, "El correo puede tener máximo 255 caracteres")
    .transform((valor) => valor.toLowerCase()),
});

export const listarPostulacionesVoluntarioQuerySchema = z.strictObject({
  estado: z
    .enum(ESTADO_POSTULACION_VOLUNTARIO_VALUES, { message: "El estado indicado no es válido" })
    .optional(),
});


export const revisarPostulacionVoluntarioSchema = z
  .strictObject({
    decision: z.enum(DECISION_POSTULACION_VOLUNTARIO_VALUES, {
      message: "La decisión debe ser ACEPTADA o RECHAZADA",
    }),
    motivoRechazo: z
      .string()
      .trim()
      .min(1, "Escribe el motivo del rechazo")
      .min(10, "El motivo debe tener al menos 10 caracteres")
      .max(1000, "El motivo puede tener máximo 1000 caracteres")
      .optional(),
  })
  
  .refine((datos) => datos.decision !== "RECHAZADA" || datos.motivoRechazo, {
    message: "Para rechazar tienes que escribir el motivo",
    path: ["motivoRechazo"],
  });