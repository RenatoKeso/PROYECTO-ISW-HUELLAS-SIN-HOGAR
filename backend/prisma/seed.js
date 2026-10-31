import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD_POR_DEFECTO = bcrypt.hashSync("refugio2026", 10);

async function main() {
  // Se borra de adentro hacia afuera. El orden importa: una tabla que tiene
  // claves foraneas debe vaciarse antes que la tabla a la que apunta.
  //
  // Primero las del modulo medico, que cuelgan de Usuario y de RegistroMedicoAnimal.
  await prisma.notificacion.deleteMany();
  await prisma.auditoriaRevisionInicial.deleteMany();
  await prisma.historialRegistroMedico.deleteMany();
  await prisma.seguimientoEnfermedadAnimal.deleteMany();
  await prisma.seguimientoTratamientoAnimal.deleteMany();
  await prisma.seguimientoMedicoAnimal.deleteMany();
  await prisma.atencionVeterinaria.deleteMany();
  await prisma.revisionInicial.deleteMany();
  await prisma.revisionCompleta.deleteMany();
  await prisma.tratamientoAnimal.deleteMany();
  await prisma.enfermedadAnimal.deleteMany();
  await prisma.atencionSanitaria.deleteMany();
  await prisma.registroMedicoAnimal.deleteMany();
  await prisma.actualizacionEstadoAnimal.deleteMany();

  // Después los modulos de adopción y devoluciones.
  await prisma.reporteDevolucion.deleteMany();
  await prisma.devolucion.deleteMany();
  await prisma.seguimientoAdopcion.deleteMany();
  await prisma.visitaAdopcion.deleteMany();
  await prisma.postulacion.deleteMany();

  // Y al final los padres.
  await prisma.ingresoAnimal.deleteMany();
  await prisma.fichaAnimal.deleteMany();
  await prisma.usuario.deleteMany();
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

  // ---------- USUARIOS Y ROLES ----------
  // El modulo medico exige identificar al actor: la_revision inicial la puede
  // hacer un voluntario autorizado o la veterinaria, y la revision final solo
  // la veterinaria. Los roles viven en Usuario, no en Voluntario.
  const cuentaDirectora = await prisma.usuario.create({
    data: {
      nombre: "Carmen Rojas",
      email: "directora@refugio.cl",
      passwordHash: PASSWORD_POR_DEFECTO,
      rol: "DIRECTORA",
    },
  });

  const cuentaVeterinaria = await prisma.usuario.create({
    data: {
      nombre: "Dra. Maria Lopez",
      email: "veterinaria@refugio.cl",
      passwordHash: PASSWORD_POR_DEFECTO,
      rol: "VETERINARIA",
      voluntarioId: Tomas.id,
    },
  });

  const cuentaVoluntaria = await prisma.usuario.create({
    data: {
      nombre: "Martina Concha",
      email: "voluntaria@refugio.cl",
      passwordHash: PASSWORD_POR_DEFECTO,
      rol: "VOLUNTARIO",
      voluntarioId: Martina.id,
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

  // Modulo de adopcion: Luna ya fue evaluada como adoptable, pero todavia no
  // se publica en el catalogo. Sirve para probar la accion "publicar".
  await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-003",
      nombre: "Luna",
      sexoAnimal: "HEMBRA",
      especie: "GATO",
      raza: "Común europeo",
      edad: 2,
      estadoEstadia: "ACTIVO",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Tranquila, acostumbrada a convivir con niños.",
    },
  });

  // ---------- INGRESOS ----------
  const ingresoGretel = await prisma.ingresoAnimal.create({
    data: {
      fichaAnimalId: Gretel.id,
      receptorId: Martina.id,
      fechaIngreso: new Date("2026-08-15"),
      procedencia: "VIA_PUBLICA",
      ubicacionEncontrado: "Avenida Collao con Chacabuco",
      estadoSalud: "Desnutricion leve",
    },
  });

  const ingresoGalileo = await prisma.ingresoAnimal.create({
    data: {
      fichaAnimalId: Galileo.id,
      receptorId: Tomas.id,
      fechaIngreso: new Date("2026-09-02"),
      procedencia: "ENTREGA_VOLUNTARIA",
      estadoSalud: "Sano",
    },
  });

  // ---------- REGISTRO MEDICO: GALILEO (recibe el animal, sin revision) ----------
  // r1: el registro medico provisional se crea en la misma transaccion que la
  // ficha y el ingreso. Galileo esta en PROVISIONAL, esperando la revision inicial.
  await prisma.registroMedicoAnimal.create({
    data: {
      animalId: Galileo.id,
      ingresoAnimalId: ingresoGalileo.id,
      estadoValidacion: "PROVISIONAL",
    },
  });

  // ---------- REGISTRO MEDICO: GRETEL (ciclo completo) ----------
  // r1: registro provisional creado automaticamente junto al ingreso.
  const registroGretel = await prisma.registroMedicoAnimal.create({
    data: {
      animalId: Gretel.id,
      ingresoAnimalId: ingresoGretel.id,
      estadoValidacion: "PROVISIONAL",
    },
  });

  // r2: revision inicial hecha por la voluntaria, con la ficha ya bloqueada
  // porque r4 permite actualizarla una sola vez y ya se uso. fechaActualizacion
  // con valor es la marca que bloquea el segundo intento.
  const revisionInicialGretel = await prisma.revisionInicial.create({
    data: {
      registroMedicoId: registroGretel.id,
      clasificacionSalud: "ENFERMO",
      prioridadAtencion: 2,
      cuarentena: true,
      observacionEstadoSalud: "Tos persistente y baja de apetito. Se observa delgada.",
      estadoRevisionInicial: "BLOQUEADA",
      fechaActualizacion: new Date("2026-08-15T19:30:00.000Z"),
      createdAt: new Date("2026-08-15T09:20:00.000Z"),
      createdById: cuentaVoluntaria.id,
      updatedById: cuentaVoluntaria.id,
    },
  });

  // r4: auditoria de la unica actualizacion permitida. Una fila por campo.
  await prisma.auditoriaRevisionInicial.createMany({
    data: [
      {
        registroMedicoId: registroGretel.id,
        campo: "observacionEstadoSalud",
        valorAnterior: "Sin observacion registrada.",
        valorNuevo: "Tos persistente y baja de apetito. Se observa delgada.",
        autorId: cuentaVoluntaria.id,
        fecha: new Date("2026-08-15T19:30:00.000Z"),
        hora: "19:30:00",
      },
      {
        registroMedicoId: registroGretel.id,
        campo: "cuarentena",
        valorAnterior: "false",
        valorNuevo: "true",
        autorId: cuentaVoluntaria.id,
        fecha: new Date("2026-08-15T19:30:00.000Z"),
        hora: "19:30:00",
      },
    ],
  });

  // r2: con la revision inicial completa el registro pasa a VALIDACION_PENDIENTE.
  await prisma.registroMedicoAnimal.update({
    where: { id: registroGretel.id },
    data: { estadoValidacion: "VALIDACION_PENDIENTE" },
  });

  // r3: revision final hecha por la veterinaria.
  const revisionCompletaGretel = await prisma.revisionCompleta.create({
    data: {
      registroMedicoId: registroGretel.id,
      edad: 3,
      peso: 12.1,
      descripcionCuidadosEspeciales: "Alimento humedo y supervision al comer.",
      descripcionCondicionMedica: "En tratamiento por tos, sin fiebre. Responde bien al antibiotico.",
      estadoSalud: "ENFERMO",
      createdAt: new Date("2026-08-16T11:00:00.000Z"),
      createdById: cuentaVeterinaria.id,
    },
  });

  // r3: evaluacion de enfermedades y tratamiento.
  const enfermedadGretel = await prisma.enfermedadAnimal.create({
    data: {
      registroMedicoId: registroGretel.id,
      descripcionEnfermedad: "Tos cronica de las vias respiratorias",
      tipoEnfermedad: "Respiratoria",
      createdAt: new Date("2026-08-16T11:05:00.000Z"),
      createdById: cuentaVeterinaria.id,
    },
  });

  const tratamientoGretel = await prisma.tratamientoAnimal.create({
    data: {
      registroMedicoId: registroGretel.id,
      descripcionTratamiento: "Antibiotico y jarabe expectorante",
      fechaInicio: new Date("2026-08-16"),
      fechaFin: new Date("2026-08-30"),
      observaciones: "Dos tomas diarias con comida.",
      createdAt: new Date("2026-08-16T11:06:00.000Z"),
      createdById: cuentaVeterinaria.id,
    },
  });

  // r3: control sanitario. Se reusa AtencionSanitaria, que ya existe con estos
  // mismos tipos y alimenta el modulo de alertas sanitarias del frontend.
  await prisma.atencionSanitaria.createMany({
    data: [
      {
        fichaAnimalId: Gretel.id,
        registroMedicoId: registroGretel.id,
        tipo: "vacuna",
        fechaProgramada: new Date("2026-08-16"),
        estado: "REALIZADA",
        fechaRealizacion: new Date("2026-08-16"),
        observaciones: "Vacuna polivalente.",
      },
      {
        fichaAnimalId: Gretel.id,
        registroMedicoId: registroGretel.id,
        tipo: "desparasitacion",
        fechaProgramada: new Date("2026-08-16"),
        estado: "REALIZADA",
        fechaRealizacion: new Date("2026-08-16"),
        observaciones: "Desparasitacion interna y externa.",
      },
      {
        fichaAnimalId: Gretel.id,
        registroMedicoId: registroGretel.id,
        tipo: "esterilizacion",
        fechaProgramada: new Date("2026-11-20"),
        estado: "PENDIENTE",
        observaciones: "Programada cuando termine el tratamiento.",
      },
    ],
  });

  // r3: la veterinaria decide que Gretel es adoptable. Queda en REALIZADO y
  // la ficha proyecta el estado de adopcion.
  await prisma.registroMedicoAnimal.update({
    where: { id: registroGretel.id },
    data: { estadoValidacion: "REALIZADO" },
  });

  await prisma.fichaAnimal.update({
    where: { id: Gretel.id },
    data: { estadoAdopcion: "ADOPTABLE" },
  });

  // r3: queda constancia del cambio de estado de adopcion en la ficha.
  await prisma.actualizacionEstadoAnimal.create({
    data: {
      animalId: Gretel.id,
      estadoAnterior: null,
      estadoNuevo: "ADOPTABLE",
      fechaActualizacion: new Date("2026-08-16T11:30:00.000Z"),
      updatedById: cuentaVeterinaria.id,
    },
  });

  // r5: una actualizacion de la veterinaria queda en el historial. La version
  // mas alta es la que el sistema usa como vigente.
  await prisma.historialRegistroMedico.create({
    data: {
      registroMedicoId: registroGretel.id,
      version: 1,
      estadoOrigen: "VALIDACION_PENDIENTE",
      peso: 12.1,
      clasificacionSalud: "ENFERMO",
      descripcionCuidadosEspeciales: "Alimento humedo y supervision al comer.",
      descripcionCondicionMedica: "En tratamiento por tos, sin fiebre. Responde bien al antibiotico.",
      descripcionTratamientos: "Antibiotico y jarabe expectorante",
      descripcionEnfermedades: "Tos cronica de las vias respiratorias",
      fecha: new Date("2026-08-20T10:00:00.000Z"),
      actualizadoPorId: cuentaVeterinaria.id,
    },
  });

  await prisma.registroMedicoAnimal.update({
    where: { id: registroGretel.id },
    data: { estadoValidacion: "ACTUALIZADO" },
  });

  // r6: seguimiento medico. Es append-only: estos dos registros no se pisan
  // entre si, cada uno guarda el estado y el peso del momento.
  const seguimientoGretel = await prisma.seguimientoMedicoAnimal.create({
    data: {
      registroMedicoId: registroGretel.id,
      fechaRegistro: new Date("2026-08-25T15:00:00.000Z"),
      peso: 12.8,
      observacionSeguimiento:
        "La tos baja de intensidad y vuelve a comer con normalidad. Debe terminar el antibiotico y tener un control antes de la esterilizacion.",
      estadoSalud: "ENFERMO",
      evolucionEstadoSalud: "MEJORANDO",
      createdAt: new Date("2026-08-25T15:00:00.000Z"),
      createdById: cuentaVeterinaria.id,
    },
  });

  await prisma.seguimientoEnfermedadAnimal.create({
    data: {
      seguimientoMedicoId: seguimientoGretel.id,
      enfermedadId: enfermedadGretel.id,
      estadoEnfermedad: "EN_CURSO",
      observacionSeguimiento: "Mejoria parcial, sigue con tos nocturno.",
    },
  });

  await prisma.seguimientoTratamientoAnimal.create({
    data: {
      seguimientoMedicoId: seguimientoGretel.id,
      tratamientoId: tratamientoGretel.id,
      estadoTratamiento: "EN_CURSO",
      observacionSeguimiento: "Faltan cinco dias de antibiotico.",
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
      observaciones: "El postulante no tiene experiencia previa con perros y vive en un departamento pequeño.",
    },
  });

  // ---------- DEVOLUCIONES ----------

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
  console.log(`  Usuarios: ${cuentaDirectora.email}, ${cuentaVeterinaria.email}, ${cuentaVoluntaria.email}`);
  console.log(`  Registros medicos: ${revisionInicialGretel.id ? 2 : 0} (Gretel ACTUALIZADO, Galileo PROVISIONAL)`);
  console.log(`  Revision completa de Gretel: ${revisionCompletaGretel.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
