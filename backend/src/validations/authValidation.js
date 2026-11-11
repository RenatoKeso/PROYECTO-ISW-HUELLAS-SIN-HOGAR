import { z } from "zod";

export const emailUsuarioSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254);

export const passwordUsuarioSchema = z
    .string()
    .min(15, "Usa al menos 15 caracteres")
    .refine(
    (valor) => Buffer.byteLength(valor, "utf8") <= 72,
    "La contraseña no puede superar 72 bytes"
);

export const loginSchema = z
    .object({
    email: emailUsuarioSchema,
    password: z.string().min(1).max(256),})
.strict();

export const primeraDirectoraSchema = z
    .object({
    nombre: z.string().trim().min(2).max(100),
    email: emailUsuarioSchema,
    password: passwordUsuarioSchema,
    })
.strict();