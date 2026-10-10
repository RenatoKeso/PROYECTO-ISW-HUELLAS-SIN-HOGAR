import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Se borra de adentro hacia afuera: Postulacion y IngresoAnimal apuntan a las
  // otras dos tablas, asi que tienen que irse primero.
  await prisma.reporteDevolucion.deleteMany();
  await prisma.devolucion.deleteMany();
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

  const postulacionNicolas = await prisma.postulacion.create({
    data: {
      fichaAnimalId: Gretel.id,
      nombrePostulante: "Nicolas Chamorro",
      rutPostulante: "12345678-9",
      telefonoPostulante: "912345678",
      tipoVivienda: "DEPARTAMENTO",
      disponibilidadTiempo: "Trabaja desde casa",
    },
  });

  const postulacionEsperanza = await prisma.postulacion.create({
    data: {
      fichaAnimalId: Gretel.id,
      nombrePostulante: "Esperanza Pereira",
      rutPostulante: "98765432-1",
      telefonoPostulante: "987654321",
      tipoVivienda: "CASA",
      disponibilidadTiempo: "Trabaja fuera de casa",
      estado: "APROBADA",
      revisorId: Martina.id,
      fechaResolucion: new Date("2026-09-10"),
      observaciones: "Postulante tiene experiencia previa con perros y cuenta con un espacio adecuado para su cuidado.",
      emailPostulante: "Espe@gmail.com",
      otrasMascotas: "Si, tiene un perro y un gato.",
    },
  });

// *---------- DEVOLUCIONES ----------*
  await prisma.devolucion.create({ 
   data: {  
      fichaAnimalId: Gretel.id,
      receptorId: Martina.id,
      postulacionId: postulacionEsperanza.id,
      fechaDevolucion: new Date("2026-09-09"),
      motivo: "COMPORTAMIENTO",
      detalle: "Mordio a un vecino",
    },
  });

  await prisma.devolucion.create({ 
   data: {  
      fichaAnimalId: Gretel.id,
      receptorId: Martina.id,
      postulacionId: postulacionNicolas.id,
      fechaDevolucion: new Date("2026-07-21"),
      motivo: "COMPORTAMIENTO",
      detalle: "El perro mostraba signos de agresividad hacia otros animales.",
    },
  });

  await prisma.devolucion.create({ 
   data: {  
      fichaAnimalId: Galileo.id,
      receptorId: Tomas.id,
      postulacionId: postulacionNicolas.id,
      fechaDevolucion: new Date("2026-08-17"),
      motivo: "SALUD",
      detalle: "El gato presentaba problemas de salud que no fueron detectados durante la adopción.",
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