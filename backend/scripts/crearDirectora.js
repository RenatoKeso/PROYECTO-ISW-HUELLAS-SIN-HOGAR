import "dotenv/config";
import bcrypt from "bcryptjs";
import { primeraDirectoraSchema } from "../src/validations/authValidation.js";
import { crearPrimeraDirectora } from "../src/repositories/usuarioRepository.js";
import prisma from "../src/config/prisma.js";

try {
    const datos = primeraDirectoraSchema.parse({
    nombre: process.env.DIRECTORA_NOMBRE,
    email: process.env.DIRECTORA_EMAIL,
    password: process.env.DIRECTORA_PASSWORD,
});

    const passwordHash = await bcrypt.hash(datos.password, 12);

    const usuario = await crearPrimeraDirectora({
    nombre: datos.nombre,
    email: datos.email,
    passwordHash,
});

    console.log(`Directora creada. ID: ${usuario.id}`);
} catch (error) {
    if (error.name === "ZodError") {
    console.error(
        "Revisa DIRECTORA_NOMBRE, DIRECTORA_EMAIL y DIRECTORA_PASSWORD en .env"
    );
} else {
    console.error("Tipo de error:", error.name);
    console.error("Código:", error.code ?? "SIN_CODIGO");

    if (
        error.message ===
        "Ya existen cuentas. Usa la administración de usuarios."
    ) {
        console.error(error.message);
    }
}

    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}