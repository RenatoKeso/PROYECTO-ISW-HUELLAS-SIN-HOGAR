import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Se borra de adentro hacia afuera: primero las tablas que apuntan a otras
  // (devoluciones, reportes, postulaciones e ingresos) y al final fichas y voluntarios.
  await prisma.devolucion.deleteMany();
  await prisma.reporteDevolucion.deleteMany();
  await prisma.postulacion.deleteMany();
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
      codigoAnimal: "anim-001",
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
      codigoAnimal: "anim-002",
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

  // ---------- POSTULACIONES ----------

  await prisma.postulacion.create({
    data: {
      fichaAnimalId: Gretel.id,
      nombrePostulante: "Juan Perez",
      rutPostulante: "12345678-5",
      telefonoPostulante: "912345678",
      tipoVivienda: "DEPARTAMENTO",
      disponibilidadTiempo: "Trabaja desde casa",
    },
  });

  await prisma.postulacion.create({
    data: {
      fichaAnimalId: Gretel.id,
      nombrePostulante: "Maria Gonzalez",
      rutPostulante: "98765432-5",
      telefonoPostulante: "987654321",
      tipoVivienda: "CASA",
      disponibilidadTiempo: "Trabaja fuera de casa",
      estado: "APROBADA",
      revisorId: Martina.id,
      fechaResolucion: new Date("2026-09-10"),
      observaciones: "Postulante tiene experiencia previa con perros y cuenta con un espacio adecuado para su cuidado.",
      emailPostulante: "benja@gmail.com",
      otrasMascotas: "Si, tiene un perro y un gato.",
    },
  });
  await prisma.postulacion.create({
    data: {
      fichaAnimalId: Gretel.id,
      nombrePostulante: "Carlos Ramirez",
      rutPostulante: "11223344-K",
      telefonoPostulante: "912345678",
      tipoVivienda: "DEPARTAMENTO",
      disponibilidadTiempo: "Trabaja desde casa",
      estado: "RECHAZADA",
      revisorId: Tomas.id,
      fechaResolucion: new Date("2026-09-12"),
      observaciones: "Postulante no tiene experiencia previa con perros y vive en un departamento pequeño.",
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