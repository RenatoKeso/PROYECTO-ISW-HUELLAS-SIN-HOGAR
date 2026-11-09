import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const aplicar = process.argv.includes("--aplicar");

async function main() {
  const fichas = await prisma.fichaAnimal.findMany({
    where: {
      registroMedicoAnimal: null,
      ingresoAnimal: {
        some: {},
      },
    },
    select: {
      id: true,
      codigoAnimal: true,
      nombre: true,
      ingresoAnimal: {
        select: {
          id: true,
          fechaIngreso: true,
        },
        orderBy: [{ fechaIngreso: "desc" }, { id: "desc" }],
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });

  if (!fichas.length) {
    console.log("No hay fichas con ingreso y sin registro medico provisional.");
    return;
  }

  console.log(
    `Se encontraron ${fichas.length} fichas con ingreso sin registro medico provisional.`,
  );

  for (const ficha of fichas) {
    const ingreso = ficha.ingresoAnimal[0];

    if (!ingreso) continue;

    console.log(
      `${aplicar ? "REPARANDO" : "DRY-RUN"} ${ficha.codigoAnimal} (${ficha.nombre || "Sin nombre"}) -> ingreso ${ingreso.id}`,
    );

    if (aplicar) {
      await prisma.$transaction(async (cliente) => {
        const existente = await cliente.registroMedicoAnimal.findUnique({
          where: { animalId: ficha.id },
          select: { id: true },
        });

        if (existente) return;

        await cliente.registroMedicoAnimal.create({
          data: {
            animalId: ficha.id,
            ingresoAnimalId: ingreso.id,
            estadoValidacion: "PROVISIONAL",
          },
        });
      });
    }
  }

  if (!aplicar) {
    console.log("Modo dry-run: no se modifico la base. Usa --aplicar para reparar.");
  } else {
    console.log("Reparacion aplicada.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
