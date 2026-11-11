import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../src/config/prisma.js";
import { ROLES_USUARIO } from "../src/services/permisosUsuario.js";
import {emailUsuarioSchema,passwordUsuarioSchema } from "../src/validations/authValidation.js";
import { crearCuentasPrueba } from "../src/repositories/cuentasPruebaRepository.js";

const definiciones = [
  [
    "DIRECTORA",
    "Directora de prueba",
    "directora.prueba@huellas.test",
  ],
  [
    "ENCARGADA_VOLUNTARIADO",
    "Encargada de voluntariado de prueba",
    "voluntariado.prueba@huellas.test",
  ],
  [
    "ENCARGADA_ADOPCIONES",
    "Encargada de adopciones de prueba",
    "adopciones.prueba@huellas.test",
  ],
  [
    "VETERINARIA",
    "Veterinaria de prueba",
    "veterinaria.prueba@huellas.test",
  ],
  [
    "VOLUNTARIO",
    "Voluntario de prueba",
    "voluntario.prueba@huellas.test",
  ],
  [
    "VOLUNTARIO_CONFIANZA",
    "Voluntario de confianza de prueba",
    "confianza.prueba@huellas.test",
  ],
];

const cuentaSchema = z.strictObject({
  rol: z.enum(ROLES_USUARIO),
  nombre: z.string().trim().min(2).max(100),
  email: emailUsuarioSchema,
  password: passwordUsuarioSchema,
});

try {
  const argumentos = process.argv.slice(2);
  const opcionesValidas = new Set(["--reset"]);
  const desconocidas = argumentos.filter(
    (argumento) => !opcionesValidas.has(argumento)
  );

  if (desconocidas.length > 0) {
    throw new Error(
      "Uso: node scripts/crearCuentasPrueba.js [--reset]"
    );
  }

  const reset = argumentos.includes("--reset");

  const cuentas = definiciones.map(
    ([rol, nombre, email]) =>
      cuentaSchema.parse({
        rol,
        nombre,
        email,
        password: randomBytes(18).toString("base64url"),
      })
  );

  const datos = await Promise.all(
    cuentas.map(async ({ password, ...cuenta }) => ({
      ...cuenta,
      passwordHash: await bcrypt.hash(password, 12),
    }))
  );

  const resultados = await crearCuentasPrueba(datos, prisma, {
    actualizarPassword: reset,
  });

  const claves = new Map(
    cuentas.map((cuenta) => [
      cuenta.email,
      cuenta.password,
    ])
  );

  console.table(
    resultados.map((cuenta) => ({
      rol: cuenta.rol,
      correo: cuenta.email,
      contrasena:
        cuenta.creada || cuenta.actualizada
          ? claves.get(cuenta.email)
          : "Ya existia: clave sin cambios",
      estado: cuenta.activo
        ? "Activa"
        : "Inactiva",
    }))
  );

  console.log(
    reset
      ? "Guarda las contrasenas de las cuentas antes de cerrar esta terminal."
      : "Guarda las contrasenas de las cuentas nuevas antes de cerrar esta terminal."
  );

  if (reset) {
    console.log(
      "Las cuentas que ya existian conservaron su estado, pero su contrasena fue regenerada."
    );
  } else {
    console.log(
      "Las cuentas que ya existian conservaron su contrasena y estado. Usa --reset para regenerarlas."
    );
  }
} catch (error) {
  console.error(
    "No se pudieron crear las cuentas de prueba."
  );

  if (error.name === "ZodError") {
    console.error(
      "La configuracion de las cuentas no cumple las validaciones del proyecto."
    );
  } else if (error.name?.startsWith("Prisma")) {
    console.error(
      "Codigo:",
      error.code ?? error.name
    );
  } else {
    console.error(error.message);
  }

  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}