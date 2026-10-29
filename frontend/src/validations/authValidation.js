import { z } from "zod";

export const loginSchema = z.object({
    email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo válido")
    .max(254, "El correo es demasiado largo"),

    password: z
    .string()
    .min(1, "Ingresa tu contraseña")
    .max(256, "La contraseña es demasiado larga"),
}).strict();

const usuarioSchema = z.object({
    id: z.number().int().positive(),
    nombre: z.string(),
    email: z.string().email(),
    rol: z.enum([
    "DIRECTORA",
    "ENCARGADA_VOLUNTARIADO",
    "ENCARGADA_ADOPCIONES",
    "VETERINARIA",
    "VOLUNTARIO",
]),
    voluntarioId: z.number().int().positive().nullable(),
});

export const loginRespuestaSchema = z.object({
    token: z.string().min(1),
    usuario: usuarioSchema,
});

export const sesionRespuestaSchema = z.object({
    usuario: usuarioSchema,
});

export const logoutRespuestaSchema = z.object({
    message: z.string(),
});