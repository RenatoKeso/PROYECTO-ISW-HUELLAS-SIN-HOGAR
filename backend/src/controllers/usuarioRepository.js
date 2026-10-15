async function obtenerCliente() {
    return (await import("../config/prisma.js")).default;
}

export async function buscarUsuarioPorEmail(email) {
    const prisma = await obtenerCliente();

return prisma.usuario.findUnique({
        where: { email },
    });
}

export async function buscarUsuarioPorId(id) {
    const prisma = await obtenerCliente();

return prisma.usuario.findUnique({
        where: { id },
    });
}

export async function invalidarSesiones(id) {
const prisma = await obtenerCliente();

await prisma.usuario.update({
    where: { id },
        data: {
        tokenVersion: { increment: 1 },
        },
    });
}

export async function crearPrimeraDirectora(datos) {
    const prisma = await obtenerCliente();

return prisma.$transaction(async (tx) => {
    // Impide que dos ejecuciones creen la cuenta inicial simultáneamente.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(731204)`;

    if ((await tx.usuario.count()) !== 0) {
        throw new Error(
        "Ya existen cuentas. Usa la administración de usuarios."
        );
    }

    return tx.usuario.create({
        data: {
        ...datos,
        rol: "DIRECTORA",
        },
    });
});
}