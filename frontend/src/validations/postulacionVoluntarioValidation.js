import { z } from "zod";

export const OPCIONES_DIAS = [
  { valor: "LUNES", texto: "Lunes" },
  { valor: "MARTES", texto: "Martes" },
  { valor: "MIERCOLES", texto: "Miércoles" },
  { valor: "JUEVES", texto: "Jueves" },
  { valor: "VIERNES", texto: "Viernes" },
  { valor: "SABADO", texto: "Sábado" },
  { valor: "DOMINGO", texto: "Domingo" },
];

export const OPCIONES_HABILIDADES = [
  { valor: "CUIDADO_ANIMALES", texto: " Cuidado de animales" },
  { valor: "LIMPIEZA", texto: " Limpieza" },
  { valor: "TRANSPORTE", texto: " Transporte" },
  { valor: "APOYO_VETERINARIO", texto: " Apoyo veterinario" },
  { valor: "DIFUSION_REDES", texto: " Difusión en redes" },
  { valor: "EVENTOS", texto: " Eventos" },
  { valor: "OTRA", texto: " Otra" },
];

const vacioAUndefined = (valor) =>
  typeof valor !== "string" || valor.trim() === "" ? undefined : valor;

export const postulacionVoluntarioFormSchema = z
  .strictObject({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(255, "El nombre es demasiado largo"),
    email: z.string().trim().min(1, "El correo es obligatorio").pipe(z.email("El correo no es válido")),
    telefono: z
      .string()
      .trim()
      .min(1, "El teléfono es obligatorio")
      .transform((valor) => valor.replace(/\s/g, ""))
      .pipe(z.string().regex(/^\+?\d{8,12}$/, "El teléfono debe tener entre 8 y 12 dígitos")),
    diasDisponibles: z.array(z.string()).min(1, "Elige al menos un día"),
    motivacion: z
      .string()
      .trim()
      .min(1, "Cuéntanos por qué quieres ser voluntario")
      .max(1000, "La motivación puede tener máximo 1000 caracteres"),
    habilidades: z.array(z.string()).min(1, "Elige al menos una habilidad"),
    otraHabilidad: z.preprocess(
      vacioAUndefined,
      z.string().trim().max(255, "La otra habilidad es demasiado larga").optional(),
    ),
  })
  .refine((datos) => !datos.habilidades.includes("OTRA") || datos.otraHabilidad, {
    message: "Si eliges Otra, escribe cuál es tu habilidad",
    path: ["otraHabilidad"],
  });