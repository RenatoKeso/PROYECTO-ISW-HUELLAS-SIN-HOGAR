import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Se borra de adentro hacia afuera: IngresoAnimal apunta a las
  // otras dos tablas, asi que tiene que irse primero.
  await prisma.ingresoAnimal.deleteMany();
  await prisma.fichaAnimal.deleteMany();
  await prisma.voluntario.deleteMany();

  // ---------- VOLUNTARIOS ----------
  const Martina = await prisma.voluntario.create({
    data: {
      nombre: "Martina Concha",
      email: "martina@refugio.cl",
      telefono: "912345678",
    },
  });

  const Tomas = await prisma.voluntario.create({
    data: {
      nombre: "Tomas morales",
      email: "tomas@refugio.cl",
      telefono: "987654321",
    },
  });

  // ---------- ANIMALES ----------
  const Gretel = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "A-001",
      nombre: "Gretel",
      sexoAnimal: "HEMBRA",
      especie: "PERRO",
      raza: "Quiltra",
      edad: 3,
      estadoEstadia: "ESPERA_ADOPCION",
      observaciones: "Sociable con otros perros.",
    },
  });

  const Galileo = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "A-002",
      nombre: "Galileo",
      sexoAnimal: "MACHO",
      especie: "GATO",
      edad: 1,
      estadoEstadia: "ACTIVO",
    },
  });

  // ---------- INGRESOS ----------
  await prisma.ingresoAnimal.create({
    data: {
      fichaAnimalId: Gretel.id,
      receptorId: Martina.id,
      fechaIngreso: new Date("2026-08-15"),
      procedencia: "VIA_PUBLICA",
      ubicacionEncontrado: "Avenida Collao con Chacabuco",
      estadoSalud: "Desnutricion leve",
    },
  });

  await prisma.ingresoAnimal.create({
    data: {
      fichaAnimalId: Galileo.id,
      receptorId: Tomas.id,
      fechaIngreso: new Date("2026-09-02"),
      procedencia: "ENTREGA_VOLUNTARIA",
      estadoSalud: "Sano",
    },
  });

  console.log("Seed completado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());