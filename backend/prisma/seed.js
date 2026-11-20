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

  // Modulo de turnos: el historial cuelga de la inscripcion y del turno, y la
  // inscripcion cuelga del turno. Todos cuelgan de Usuario o Voluntario, asi que
  // deben vaciarse antes que ellos.
  await prisma.historialInscripcion.deleteMany();
  await prisma.inscripcionTurno.deleteMany();
  await prisma.turno.deleteMany();
  await prisma.postulacionVoluntario.deleteMany();

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

  // Segundo voluntario con cuenta propia, para probar solapes y cupos del
  // modulo de turnos sin depender de Martina.
  const Diego = await prisma.voluntario.create({
    data: {
      nombre: "Diego Fuentes",
      email: "diego@refugio.cl",
      telefono: "955512345",
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

  const cuentaVoluntario = await prisma.usuario.create({
    data: {
      nombre: "Diego Fuentes",
      email: "voluntario@refugio.cl",
      passwordHash: PASSWORD_POR_DEFECTO,
      rol: "VOLUNTARIO",
      voluntarioId: Diego.id,
    },
  });

  // Publica y administra los turnos. No necesita ficha de voluntario.
  const cuentaEncargada = await prisma.usuario.create({
    data: {
      nombre: "Paula Reyes",
      email: "encargada@refugio.cl",
      passwordHash: PASSWORD_POR_DEFECTO,
      rol: "ENCARGADA_VOLUNTARIADO",
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

  // Modulo de adopcion: Luna ya fue evaluada como adoptable, asi que esta
  // publicada en el catalogo (un animal adoptable pasa automaticamente a ESPERA_ADOPCION).
  const Luna = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-003",
      nombre: "Luna",
      sexoAnimal: "HEMBRA",
      especie: "GATO",
      raza: "Común europeo",
      edad: 2,
      estadoEstadia: "ESPERA_ADOPCION",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Tranquila, acostumbrada a convivir con niños.",
    },
  });

  const Triton = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-004",
      nombre: "Triton",
      sexoAnimal: "MACHO",
      especie: "PERRO",
      raza: "Poodle mestizo",
      edad: 4,
      estadoEstadia: "ADOPTADO",
      observaciones: "Juguetón, se pone nervioso con ruidos fuertes.",
    },
  });

  // Modulo de adopcion: mas animales para que cada estado de postulacion tenga
  // ejemplos. Canela, Simon y Bruno estan publicados en el catalogo; Mora,
  // Pelusa, Toby y Nala ya fueron entregados en adopcion.
  const Canela = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-005",
      nombre: "Canela",
      sexoAnimal: "HEMBRA",
      especie: "PERRO",
      raza: "Mestiza",
      edad: 5,
      estadoEstadia: "ESPERA_ADOPCION",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Tranquila, ideal para una casa sin niños pequeños.",
    },
  });

  const Simon = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-006",
      nombre: "Simón",
      sexoAnimal: "MACHO",
      especie: "GATO",
      raza: "Común europeo",
      edad: 3,
      estadoEstadia: "ESPERA_ADOPCION",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Curioso y cariñoso, convive bien con otros gatos.",
    },
  });

  const Bruno = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-007",
      nombre: "Bruno",
      sexoAnimal: "MACHO",
      especie: "PERRO",
      raza: "Labrador mestizo",
      edad: 2,
      estadoEstadia: "ESPERA_ADOPCION",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Muy activo, necesita paseos todos los días.",
    },
  });

  const Mora = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-008",
      nombre: "Mora",
      sexoAnimal: "HEMBRA",
      especie: "PERRO",
      raza: "Quiltra",
      edad: 6,
      estadoEstadia: "ADOPTADO",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Tranquila y cariñosa con las personas mayores.",
    },
  });

  const Pelusa = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-009",
      nombre: "Pelusa",
      sexoAnimal: "HEMBRA",
      especie: "GATO",
      raza: "Angora mestiza",
      edad: 4,
      estadoEstadia: "ADOPTADO",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Le gusta estar en brazos; necesita cepillado frecuente.",
    },
  });

  const Toby = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-010",
      nombre: "Toby",
      sexoAnimal: "MACHO",
      especie: "PERRO",
      raza: "Beagle mestizo",
      edad: 7,
      estadoEstadia: "ADOPTADO",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Perro senior, tranquilo y obediente con la correa.",
    },
  });

  const Nala = await prisma.fichaAnimal.create({
    data: {
      codigoAnimal: "anim-011",
      nombre: "Nala",
      sexoAnimal: "HEMBRA",
      especie: "GATO",
      raza: "Común europeo",
      edad: 1,
      estadoEstadia: "ADOPTADO",
      estadoAdopcion: "ADOPTABLE",
      observaciones: "Juguetona y sociable.",
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
  // con valor es la marca que bloquea el segundo intento. Los datos clinicos
  // viven en RegistroMedicoAnimal: esta fila solo lleva el ciclo de vida.
  const revisionInicialGretel = await prisma.revisionInicial.create({
    data: {
      registroMedicoId: registroGretel.id,
      estadoRevisionInicial: "BLOQUEADA",
      fechaActualizacion: new Date("2026-08-15T19:30:00.000Z"),
      createdAt: new Date("2026-08-15T09:20:00.000Z"),
      createdById: cuentaVoluntaria.id,
      updatedById: cuentaVoluntaria.id,
    },
  });

  // r2: los datos de la revision inicial viven en RegistroMedicoAnimal. El
  // registro queda con la firma del revisor y la fecha de la revision.
  await prisma.registroMedicoAnimal.update({
    where: { id: registroGretel.id },
    data: {
      pesoKg: 12.4,
      clasificacionSalud: "ENFERMO",
      observacionInicial: "Tos persistente y baja de apetito. Se observa delgada.",
      requiereCuarentena: true,
      fechaRevisionInicial: new Date("2026-08-15T09:20:00.000Z"),
      revisionInicialPorId: cuentaVoluntaria.id,
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

  // ---------- POSTULACIONES DE ADOPCION ----------
  // Cinco postulaciones por estado, guardadas como las deja el sistema:
  // - al aprobar o rechazar queda quien reviso y cuando (revisorId, fechaResolucion);
  // - una visita desfavorable rechaza una postulacion que ya estaba aprobada;
  // - al entregar un animal, sus otras postulaciones abiertas quedan CERRADAS
  //   con la fecha de la entrega.
  // Los correos usan example.com, un dominio reservado que no recibe correos: si se aprueba una
  // postulacion de ejemplo con Gmail configurado, no le llega a nadie real.
  // Las fechas con hora van en hora de Chile para que el dia no cambie al
  // mostrarlas; las fechas sin hora (@db.Date) van como "AAAA-MM-DD".
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const enChile = (fechaHora) => new Date(`${fechaHora.replace(" ", "T")}:00-03:00`);

  async function crearPostulacion({ animal, recibida, ...datos }) {
    return prisma.postulacion.create({
      data: {
        fichaAnimalId: animal.id,
        aceptaSeguimiento: true,
        createdAt: enChile(recibida),
        ...datos,
      },
    });
  }

  // Datos que guarda la directora al aprobar o rechazar.
  function revisada(fechaHora, observaciones) {
    return {
      revisorId: cuentaDirectora.id,
      fechaResolucion: enChile(fechaHora),
      ...(observaciones ? { observaciones } : {}),
    };
  }

  async function registrarVisitas(postulacion, visitas) {
    await prisma.visitaAdopcion.createMany({
      data: visitas.map(({ tipo, fecha, resultado = "FAVORABLE", observaciones }) => ({
        postulacionId: postulacion.id,
        tipo,
        fechaVisita: new Date(fecha),
        resultado,
        observaciones,
        registradaPorId: cuentaDirectora.id,
      })),
    });
  }

  // Los seguimientos se programan a 15 y 30 dias de la entrega, igual que en
  // el sistema. "realizados" dice cuantos ya se hicieron.
  async function crearSeguimientos(postulacion, fechaEntrega, realizados) {
    await prisma.seguimientoAdopcion.createMany({
      data: [15, 30].map((dias, indice) => ({
        postulacionId: postulacion.id,
        diasDesdeEntrega: dias,
        fechaProgramada: new Date(new Date(fechaEntrega).getTime() + dias * MS_POR_DIA),
        estado: indice < realizados ? "REALIZADO" : "PENDIENTE",
      })),
    });
  }

  // ----- EN REVISION -----
  const postulacionNicolas = await crearPostulacion({
    animal: Gretel,
    recibida: "2026-11-02 10:30",
    nombrePostulante: "Nicolas Chamorro",
    rutPostulante: "16482913-8",
    fechaNacimientoPostulante: new Date("1994-03-12"),
    telefonoPostulante: "934127856",
    emailPostulante: "nicolas.chamorro@example.com",
    direccionPostulante: "Av. Collín 845, depto. 32",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: false,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 2,
    disponibilidadTiempo: "Trabajo desde casa y salgo a caminar todas las tardes.",
    motivoAdopcion: "Vivo con mi pareja y queremos adoptar una perrita adulta y tranquila.",
  });

  await crearPostulacion({
    animal: Luna,
    recibida: "2026-11-14 18:45",
    nombrePostulante: "Fernanda Castillo Ruiz",
    rutPostulante: "18934527-5",
    fechaNacimientoPostulante: new Date("1996-08-21"),
    telefonoPostulante: "945128763",
    emailPostulante: "fernanda.castillo.ruiz@example.com",
    direccionPostulante: "Los Carrera 1290",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "PROPIA",
    tienePatio: false,
    personasHogar: 1,
    hayNinos: false,
    horasSoloAlDia: 8,
    disponibilidadTiempo: "Trabajo de 9:00 a 17:00 en una oficina cerca de mi casa y vuelvo a almorzar.",
    motivoAdopcion:
      "Vivo sola y quiero adoptar una gata tranquila. Mi departamento tiene mallas en las ventanas y ya tengo arenero y rascador.",
  });

  await crearPostulacion({
    animal: Canela,
    recibida: "2026-11-16 21:10",
    nombrePostulante: "Matías Sepúlveda Lagos",
    rutPostulante: "17256381-3",
    fechaNacimientoPostulante: new Date("1990-02-11"),
    telefonoPostulante: "978341265",
    emailPostulante: "matias.sepulveda@example.com",
    direccionPostulante: "Pasaje Los Robles 456",
    comunaPostulante: "Chillán Viejo",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 3,
    hayNinos: false,
    otrasMascotas: "Un perro macho de 8 años, castrado",
    horasSoloAlDia: 4,
    disponibilidadTiempo: "Trabajo por turnos en el hospital; mi pareja está en casa en las tardes.",
    motivoAdopcion:
      "Nuestro perro ya está viejito y le haría bien una compañera tranquila. Tenemos patio cerrado y mucha experiencia con perros.",
  });

  await crearPostulacion({
    animal: Simon,
    recibida: "2026-11-17 12:20",
    nombrePostulante: "Josefa Navarrete Pinto",
    rutPostulante: "19873402-0",
    fechaNacimientoPostulante: new Date("1999-12-03"),
    telefonoPostulante: "962487315",
    emailPostulante: "josefa.navarrete.p@example.com",
    direccionPostulante: "Av. O'Higgins 2150, depto. 1203",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: false,
    personasHogar: 2,
    hayNinos: false,
    otrasMascotas: "Una gata de 2 años",
    horasSoloAlDia: 7,
    disponibilidadTiempo: "Estudio en la universidad en las mañanas y en las tardes estoy en casa.",
    motivoAdopcion:
      "Mi gata es muy sociable y creemos que Simón sería un buen compañero para ella. El contrato de arriendo permite mascotas.",
  });

  await crearPostulacion({
    animal: Bruno,
    recibida: "2026-11-18 16:05",
    nombrePostulante: "Ignacio Paredes Muñoz",
    rutPostulante: "20145786-6",
    fechaNacimientoPostulante: new Date("2001-06-15"),
    telefonoPostulante: "981236547",
    emailPostulante: "ignacio.paredes@example.com",
    direccionPostulante: "Camino a Coihueco km 3",
    comunaPostulante: "Coihueco",
    tipoVivienda: "CASA",
    tenenciaVivienda: "OTRA",
    tienePatio: true,
    personasHogar: 5,
    hayNinos: true,
    horasSoloAlDia: 2,
    disponibilidadTiempo: "Vivo con mis papás y mis hermanos; siempre hay alguien en la casa.",
    motivoAdopcion:
      "Bruno necesita mucho ejercicio y vivimos en el campo, con espacio para correr. Mis hermanos lo sacarían a pasear todos los días.",
  });

  // ----- APROBADAS (en distintos pasos del proceso) -----
  // Esperanza: aprobada y con la primera visita; falta la visita al hogar.
  const postulacionEsperanza = await crearPostulacion({
    animal: Gretel,
    recibida: "2026-11-03 11:00",
    nombrePostulante: "Esperanza Pereira",
    rutPostulante: "15392847-9",
    fechaNacimientoPostulante: new Date("1988-07-25"),
    telefonoPostulante: "987654321",
    emailPostulante: "esperanza.pereira@example.com",
    direccionPostulante: "Los Aromos 1520",
    comunaPostulante: "Chillán Viejo",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 4,
    hayNinos: true,
    otrasMascotas: "Un perro y un gato",
    horasSoloAlDia: 6,
    disponibilidadTiempo: "Trabajo fuera de casa en las mañanas; en las tardes estamos todos.",
    motivoAdopcion: "Tenemos experiencia con perros y un patio cerrado donde puede estar segura.",
    estado: "APROBADA",
    ...revisada(
      "2026-11-05 10:00",
      "Tiene experiencia previa con perros y un espacio adecuado para su cuidado.",
    ),
  });
  await registrarVisitas(postulacionEsperanza, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-09",
      observaciones: "Vino con sus dos hijos; Gretel se mostró tranquila y jugó con los niños.",
    },
  ]);

  // Rodrigo: con las dos visitas favorables, lista para entregar.
  const postulacionRodrigo = await crearPostulacion({
    animal: Luna,
    recibida: "2026-11-06 19:30",
    nombrePostulante: "Rodrigo Vergara Rojas",
    rutPostulante: "13748265-7",
    fechaNacimientoPostulante: new Date("1985-04-27"),
    telefonoPostulante: "957312468",
    emailPostulante: "rodrigo.vergara@example.com",
    direccionPostulante: "Calle Itata 734",
    comunaPostulante: "Bulnes",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 4,
    hayNinos: true,
    horasSoloAlDia: 3,
    disponibilidadTiempo: "Trabajo en la mañana; mi esposa y mis hijos están en casa en la tarde.",
    motivoAdopcion:
      "Mis hijos siempre han querido un gato y Luna está acostumbrada a convivir con niños. Tuvimos una gata por 12 años.",
    estado: "APROBADA",
    ...revisada("2026-11-10 11:15", "Tiene experiencia con gatos y su casa es tranquila."),
  });
  await registrarVisitas(postulacionRodrigo, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-12",
      observaciones: "Luna se dejó acariciar desde el primer momento.",
    },
    {
      tipo: "VISITA_HOGAR",
      fecha: "2026-11-15",
      observaciones: "Casa con ventanas protegidas y un espacio preparado para Luna.",
    },
  ]);

  // Daniela: voluntaria del refugio; se omitio la visita al hogar.
  const postulacionDaniela = await crearPostulacion({
    animal: Canela,
    recibida: "2026-11-07 09:40",
    nombrePostulante: "Daniela Fuentes Araya",
    rutPostulante: "19561238-2",
    fechaNacimientoPostulante: new Date("1997-10-09"),
    telefonoPostulante: "948263175",
    emailPostulante: "daniela.fuentes.a@example.com",
    direccionPostulante: "Villa Los Volcanes, pasaje 3, casa 18",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: true,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 5,
    disponibilidadTiempo: "Trabajo media jornada y en las tardes estoy en casa.",
    motivoAdopcion:
      "Conozco a Canela desde que llegó al refugio, porque soy voluntaria. Es tranquila y se adaptaría bien a mi casa, donde no hay niños.",
    estado: "APROBADA",
    ...revisada("2026-11-11 10:00", "Es voluntaria del refugio y conoce a Canela."),
    motivoOmisionVisitaHogar: "POSTULANTE_CONOCIDO",
    observacionOmisionVisitaHogar: "Es voluntaria hace dos años y el equipo ya conoce su casa.",
    fechaOmisionVisitaHogar: enChile("2026-11-13 16:00"),
    omisionAutorizadaPorId: cuentaDirectora.id,
  });
  await registrarVisitas(postulacionDaniela, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-13",
      observaciones: "Canela la reconoció y salió a pasear con ella sin problemas.",
    },
  ]);

  // Sebastian: con la primera visita; falta la visita al hogar.
  const postulacionSebastian = await crearPostulacion({
    animal: Simon,
    recibida: "2026-11-09 20:15",
    nombrePostulante: "Sebastián Muñoz Herrera",
    rutPostulante: "17932654-K",
    fechaNacimientoPostulante: new Date("1992-01-30"),
    telefonoPostulante: "973451286",
    emailPostulante: "sebastian.munoz.h@example.com",
    direccionPostulante: "Av. Argentina 588, depto. 402",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "PROPIA",
    tienePatio: false,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 6,
    disponibilidadTiempo: "Trabajo de lunes a viernes; los fines de semana estoy en casa.",
    motivoAdopcion:
      "Con mi pareja queremos adoptar un gato adulto. Ya instalamos mallas en el balcón y tenemos todo listo para recibirlo.",
    estado: "APROBADA",
    ...revisada("2026-11-12 12:30"),
  });
  await registrarVisitas(postulacionSebastian, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-16",
      observaciones: "Simón se acercó solo y estuvo jugando toda la visita.",
    },
  ]);

  // Catalina: recien aprobada, todavia sin visitas.
  await crearPostulacion({
    animal: Bruno,
    recibida: "2026-11-14 13:00",
    nombrePostulante: "Catalina Rivas Molina",
    rutPostulante: "18203597-1",
    fechaNacimientoPostulante: new Date("1994-05-18"),
    telefonoPostulante: "964128937",
    emailPostulante: "catalina.rivas.m@example.com",
    direccionPostulante: "Parcela 12, El Emboque",
    comunaPostulante: "Pinto",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 3,
    hayNinos: true,
    otrasMascotas: "Una perrita de 4 años",
    horasSoloAlDia: 3,
    disponibilidadTiempo: "Trabajo desde casa y salgo a correr todas las mañanas.",
    motivoAdopcion:
      "Bruno necesita ejercicio diario y yo salgo a correr todos los días. Tenemos un patio grande y cerrado, y otra perrita para que juegue.",
    estado: "APROBADA",
    ...revisada("2026-11-18 09:30", "Casa con patio grande, ideal para un perro activo."),
  });

  // ----- RECHAZADAS -----
  // Tres se rechazan al revisarlas y dos por una visita desfavorable.
  await crearPostulacion({
    animal: Gretel,
    recibida: "2026-09-08 12:00",
    nombrePostulante: "Carlos Ramirez",
    rutPostulante: "11223344-K",
    fechaNacimientoPostulante: new Date("1999-11-02"),
    telefonoPostulante: "912873465",
    emailPostulante: "carlos.ramirez@example.com",
    direccionPostulante: "Libertad 402, depto. 51",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: false,
    tienePatio: false,
    personasHogar: 1,
    hayNinos: false,
    horasSoloAlDia: 9,
    disponibilidadTiempo: "Trabajo fuera de casa de 8:00 a 18:00.",
    motivoAdopcion: "Me gustaría tener compañía en el departamento.",
    estado: "RECHAZADA",
    ...revisada(
      "2026-09-12 11:00",
      "El contrato de arriendo no permite mascotas y Gretel pasaría 9 horas sola al día.",
    ),
  });

  await crearPostulacion({
    animal: Luna,
    recibida: "2026-11-04 15:20",
    nombrePostulante: "Felipe Rojas Contreras",
    rutPostulante: "16754129-1",
    fechaNacimientoPostulante: new Date("1979-09-14"),
    telefonoPostulante: "932187654",
    emailPostulante: "felipe.rojas.c@example.com",
    direccionPostulante: "Fundo Santa Elena s/n",
    comunaPostulante: "San Carlos",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 2,
    hayNinos: false,
    otrasMascotas: "Dos perros que viven en el patio",
    horasSoloAlDia: 10,
    disponibilidadTiempo: "Paso el día trabajando en el campo.",
    motivoAdopcion: "Tenemos ratones en la bodega del fundo y necesitamos un gato que viva afuera.",
    estado: "RECHAZADA",
    ...revisada(
      "2026-11-06 10:30",
      "Busca un gato para controlar ratones en la bodega, que viva afuera y sin entrar a la casa.",
    ),
  });

  await crearPostulacion({
    animal: Canela,
    recibida: "2026-11-05 22:40",
    nombrePostulante: "Antonia Vidal Cáceres",
    rutPostulante: "20587341-4",
    fechaNacimientoPostulante: new Date("2000-03-22"),
    telefonoPostulante: "986543127",
    emailPostulante: "antonia.vidal@example.com",
    direccionPostulante: "Av. Collín 1020, depto. 805",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: false,
    personasHogar: 1,
    hayNinos: false,
    horasSoloAlDia: 12,
    disponibilidadTiempo: "Trabajo y estudio en vespertino: salgo a las 8:00 y vuelvo a las 20:00.",
    motivoAdopcion: "Siempre quise tener un perro y Canela me pareció muy tierna en las fotos.",
    estado: "RECHAZADA",
    ...revisada(
      "2026-11-07 12:00",
      "Canela pasaría 12 horas sola al día y no hay quien pueda sacarla a pasear.",
    ),
  });

  // Cristobal: aprobado, pero la primera visita fue desfavorable.
  const postulacionCristobal = await crearPostulacion({
    animal: Simon,
    recibida: "2026-11-02 17:00",
    nombrePostulante: "Cristóbal Lagos Fuentealba",
    rutPostulante: "14628973-8",
    fechaNacimientoPostulante: new Date("1983-11-05"),
    telefonoPostulante: "951287346",
    emailPostulante: "cristobal.lagos@example.com",
    direccionPostulante: "Pasaje Las Acacias 92",
    comunaPostulante: "Chillán Viejo",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 4,
    hayNinos: true,
    horasSoloAlDia: 5,
    disponibilidadTiempo: "Trabajo en la mañana y en la tarde estoy con mis hijos.",
    motivoAdopcion: "Queremos un gato para que nuestros hijos aprendan a cuidar una mascota.",
    estado: "RECHAZADA",
    ...revisada("2026-11-04 10:00"),
  });
  await registrarVisitas(postulacionCristobal, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-06",
      resultado: "DESFAVORABLE",
      observaciones:
        "Tomó a Simón de forma brusca y no respetó las indicaciones del equipo durante la visita.",
    },
  ]);

  // Javiera: primera visita favorable, pero la visita al hogar fue desfavorable.
  const postulacionJaviera = await crearPostulacion({
    animal: Bruno,
    recibida: "2026-11-03 14:10",
    nombrePostulante: "Javiera Ortiz Bustos",
    rutPostulante: "19305846-9",
    fechaNacimientoPostulante: new Date("1998-07-07"),
    telefonoPostulante: "927613458",
    emailPostulante: "javiera.ortiz.b@example.com",
    direccionPostulante: "Calle Maipón 1488",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: true,
    personasHogar: 3,
    hayNinos: false,
    horasSoloAlDia: 4,
    disponibilidadTiempo: "Trabajo de 8:00 a 14:00 y las tardes estoy en casa.",
    motivoAdopcion:
      "Me encantan los perros grandes y activos. Bruno podría acompañarme cuando salgo a trotar.",
    estado: "RECHAZADA",
    ...revisada("2026-11-05 11:30", "Tiene experiencia con perros grandes."),
  });
  await registrarVisitas(postulacionJaviera, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-07",
      observaciones: "Bruno jugó con ella y respondió bien a sus llamados.",
    },
    {
      tipo: "VISITA_HOGAR",
      fecha: "2026-11-10",
      resultado: "DESFAVORABLE",
      observaciones:
        "El patio no tiene cierre y da a una calle con mucho tránsito; no quiso hacer cambios.",
    },
  ]);

  // ----- ENTREGADAS -----
  // Cada una tiene sus visitas (o la omision) antes de la entrega y sus dos
  // seguimientos. Al entregar, las demas postulaciones del animal se cierran.
  const postulacionValentina = await crearPostulacion({
    animal: Triton,
    recibida: "2026-10-01 11:00",
    nombrePostulante: "Valentina Soto",
    rutPostulante: "15678234-3",
    fechaNacimientoPostulante: new Date("1991-05-30"),
    telefonoPostulante: "956781234",
    emailPostulante: "vale.soto@example.com",
    direccionPostulante: "Pasaje Las Lilas 77",
    comunaPostulante: "San Carlos",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 3,
    hayNinos: true,
    horasSoloAlDia: 4,
    disponibilidadTiempo: "Trabajo medio tiempo y en las tardes estoy en casa.",
    motivoAdopcion: "Queremos un perro juguetón para la familia y tenemos patio cerrado.",
    estado: "ENTREGADA",
    ...revisada("2026-10-10 10:00", "Casa con patio cerrado y experiencia con perros."),
    fechaEntrega: new Date("2026-10-20"),
    documentacionEntregada: "Contrato de adopción firmado y carnet de vacunas al día.",
  });
  await registrarVisitas(postulacionValentina, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-10-13",
      observaciones: "Se conocieron en el refugio y Triton se mostró tranquilo con ella.",
    },
    {
      tipo: "VISITA_HOGAR",
      fecha: "2026-10-16",
      observaciones: "Patio cerrado y espacio adecuado para un perro mediano.",
    },
  ]);
  await crearSeguimientos(postulacionValentina, "2026-10-20", 1);

  const postulacionGonzalo = await crearPostulacion({
    animal: Mora,
    recibida: "2026-09-20 10:15",
    nombrePostulante: "Gonzalo Pino Sandoval",
    rutPostulante: "17489562-7",
    fechaNacimientoPostulante: new Date("1975-12-01"),
    telefonoPostulante: "942318765",
    emailPostulante: "gonzalo.pino@example.com",
    direccionPostulante: "Av. Brasil 1755",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 3,
    disponibilidadTiempo: "Estoy jubilado y paso la mayor parte del día en casa.",
    motivoAdopcion:
      "Con mi señora queremos adoptar una perrita adulta y tranquila que nos acompañe en casa.",
    estado: "ENTREGADA",
    ...revisada("2026-09-23 11:00", "Casa amplia y ya tuvo perros adultos."),
    fechaEntrega: new Date("2026-10-05"),
    documentacionEntregada:
      "Contrato de adopción firmado, carnet de vacunas y certificado de esterilización.",
  });
  await registrarVisitas(postulacionGonzalo, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-09-26",
      observaciones: "Mora se acercó tranquila y aceptó la correa sin problemas.",
    },
    {
      tipo: "VISITA_HOGAR",
      fecha: "2026-09-30",
      observaciones: "Patio cerrado y una casa de perro nueva bajo techo.",
    },
  ]);
  await crearSeguimientos(postulacionGonzalo, "2026-10-05", 2);

  // Carolina vive lejos: se omitio la visita al hogar por distancia.
  const postulacionCarolina = await crearPostulacion({
    animal: Pelusa,
    recibida: "2026-10-08 18:30",
    nombrePostulante: "Carolina Méndez Ulloa",
    rutPostulante: "18762435-5",
    fechaNacimientoPostulante: new Date("1989-03-16"),
    telefonoPostulante: "968214573",
    emailPostulante: "carolina.mendez.u@example.com",
    direccionPostulante: "Calle Los Copihues 340",
    comunaPostulante: "Quillón",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 3,
    hayNinos: true,
    horasSoloAlDia: 4,
    disponibilidadTiempo: "Trabajo como profesora hasta las 14:00.",
    motivoAdopcion:
      "Mi hija sueña con tener una gata y Pelusa es muy cariñosa. Tenemos una casa tranquila y con espacio.",
    estado: "ENTREGADA",
    ...revisada("2026-10-10 12:00"),
    motivoOmisionVisitaHogar: "DISTANCIA",
    observacionOmisionVisitaHogar:
      "Vive en Quillón; envió fotos y un video de la casa preparada para Pelusa.",
    fechaOmisionVisitaHogar: enChile("2026-10-15 10:00"),
    omisionAutorizadaPorId: cuentaDirectora.id,
    fechaEntrega: new Date("2026-10-22"),
    documentacionEntregada: "Contrato de adopción firmado y carnet de vacunas al día.",
  });
  await registrarVisitas(postulacionCarolina, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-10-14",
      observaciones: "Pelusa se quedó en sus brazos durante toda la visita.",
    },
  ]);
  await crearSeguimientos(postulacionCarolina, "2026-10-22", 1);

  const postulacionAndres = await crearPostulacion({
    animal: Toby,
    recibida: "2026-10-15 11:45",
    nombrePostulante: "Andrés Torres Vega",
    rutPostulante: "15947318-K",
    fechaNacimientoPostulante: new Date("1980-08-08"),
    telefonoPostulante: "935174286",
    emailPostulante: "andres.torres.vega@example.com",
    direccionPostulante: "Av. Ecuador 455, depto. 101",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 1,
    hayNinos: false,
    horasSoloAlDia: 5,
    disponibilidadTiempo: "Trabajo de 9:00 a 14:00; en la tarde estoy en casa.",
    motivoAdopcion:
      "Quiero adoptar un perro mayor, porque sé que les cuesta más encontrar hogar. Vivo en un primer piso con patio.",
    estado: "ENTREGADA",
    ...revisada("2026-10-17 10:30", "Tiene experiencia con perros mayores."),
    fechaEntrega: new Date("2026-10-29"),
    documentacionEntregada:
      "Contrato de adopción firmado, carnet de vacunas y pauta de alimentación para perro senior.",
  });
  await registrarVisitas(postulacionAndres, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-10-21",
      observaciones: "Toby caminó con él por el refugio sin tirar de la correa.",
    },
    {
      tipo: "VISITA_HOGAR",
      fecha: "2026-10-24",
      observaciones: "Departamento en primer piso con salida a un patio cerrado.",
    },
  ]);
  await crearSeguimientos(postulacionAndres, "2026-10-29", 1);

  const postulacionFrancisca = await crearPostulacion({
    animal: Nala,
    recibida: "2026-10-28 20:00",
    nombrePostulante: "Francisca Molina Reyes",
    rutPostulante: "21034675-9",
    fechaNacimientoPostulante: new Date("2002-02-14"),
    telefonoPostulante: "979346128",
    emailPostulante: "francisca.molina.r@example.com",
    direccionPostulante: "Av. Vicente Méndez 1180, depto. 23",
    comunaPostulante: "Chillán",
    tipoVivienda: "DEPARTAMENTO",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: false,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 6,
    disponibilidadTiempo:
      "Estudio en la mañana y trabajo medio tiempo en la tarde; mi hermana está en casa.",
    motivoAdopcion:
      "Con mi hermana queremos adoptar una gatita joven. Ya preparamos el departamento con mallas, arenero y rascador.",
    estado: "ENTREGADA",
    ...revisada("2026-10-30 11:00"),
    fechaEntrega: new Date("2026-11-10"),
    documentacionEntregada: "Contrato de adopción firmado y carnet de vacunas al día.",
  });
  await registrarVisitas(postulacionFrancisca, [
    {
      tipo: "PRIMERA_VISITA",
      fecha: "2026-11-03",
      observaciones: "Nala jugó con ella y se dejó tomar sin problemas.",
    },
    {
      tipo: "VISITA_HOGAR",
      fecha: "2026-11-06",
      observaciones: "Mallas en todas las ventanas y un espacio preparado con arenero y rascador.",
    },
  ]);
  await crearSeguimientos(postulacionFrancisca, "2026-11-10", 0);

  // ----- CERRADAS -----
  // Seguian abiertas cuando su animal se entrego a otra persona.
  await crearPostulacion({
    animal: Mora,
    recibida: "2026-09-25 19:00",
    nombrePostulante: "Marcelo Araya Núñez",
    rutPostulante: "16218534-9",
    fechaNacimientoPostulante: new Date("1987-06-25"),
    telefonoPostulante: "944871236",
    emailPostulante: "marcelo.araya@example.com",
    direccionPostulante: "Pasaje Ñuble 233",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: true,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 7,
    disponibilidadTiempo: "Trabajo de lunes a viernes en el centro de Chillán.",
    motivoAdopcion: "Quiero una perrita tranquila para que me acompañe en la casa.",
    estado: "CERRADA",
    fechaResolucion: enChile("2026-10-05 12:00"),
  });

  // Isidora alcanzo a ser aprobada, pero Mora se entrego antes de su primera visita.
  await crearPostulacion({
    animal: Mora,
    recibida: "2026-09-22 16:30",
    nombrePostulante: "Isidora Campos Leiva",
    rutPostulante: "18491276-7",
    fechaNacimientoPostulante: new Date("1995-09-02"),
    telefonoPostulante: "958172634",
    emailPostulante: "isidora.campos@example.com",
    direccionPostulante: "Av. Las Rosas 870",
    comunaPostulante: "Chillán Viejo",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 3,
    hayNinos: true,
    otrasMascotas: "Un gato de 6 años",
    horasSoloAlDia: 4,
    disponibilidadTiempo: "Trabajo en las mañanas y mi mamá está en casa todo el día.",
    motivoAdopcion:
      "Mi familia quiere adoptar una perrita adulta; tenemos patio y mucho tiempo para ella.",
    estado: "CERRADA",
    revisorId: cuentaDirectora.id,
    observaciones: "Buena disposición; falta coordinar la primera visita.",
    fechaResolucion: enChile("2026-10-05 12:00"),
  });

  await crearPostulacion({
    animal: Pelusa,
    recibida: "2026-10-12 14:00",
    nombrePostulante: "Valeria Gutiérrez Pérez",
    rutPostulante: "17605893-5",
    fechaNacimientoPostulante: new Date("1993-04-11"),
    telefonoPostulante: "921736845",
    emailPostulante: "valeria.gutierrez@example.com",
    direccionPostulante: "Calle Arauco 640",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: false,
    personasHogar: 2,
    hayNinos: false,
    horasSoloAlDia: 6,
    disponibilidadTiempo: "Trabajo de 9:00 a 17:00; mi pareja trabaja desde casa.",
    motivoAdopcion: "Nos encantan los gatos de pelo largo y Pelusa es preciosa.",
    estado: "CERRADA",
    fechaResolucion: enChile("2026-10-22 12:00"),
  });

  await crearPostulacion({
    animal: Toby,
    recibida: "2026-10-20 09:30",
    nombrePostulante: "Pablo Cáceres Ibáñez",
    rutPostulante: "19728451-K",
    fechaNacimientoPostulante: new Date("1998-10-28"),
    telefonoPostulante: "976518243",
    emailPostulante: "pablo.caceres@example.com",
    direccionPostulante: "Av. Andrés Bello 1340",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: true,
    tienePatio: true,
    personasHogar: 4,
    hayNinos: false,
    horasSoloAlDia: 5,
    disponibilidadTiempo: "Trabajo en turnos de tarde; en las mañanas estoy en casa.",
    motivoAdopcion:
      "Toby me recordó a mi perro, que murió el año pasado, y me gustaría darle un hogar.",
    estado: "CERRADA",
    fechaResolucion: enChile("2026-10-29 12:00"),
  });

  await crearPostulacion({
    animal: Nala,
    recibida: "2026-11-01 21:15",
    nombrePostulante: "Martín Espinoza Ríos",
    rutPostulante: "14386927-K",
    fechaNacimientoPostulante: new Date("1978-02-19"),
    telefonoPostulante: "989123457",
    emailPostulante: "martin.espinoza@example.com",
    direccionPostulante: "Calle Libertad 990",
    comunaPostulante: "San Carlos",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 4,
    hayNinos: true,
    otrasMascotas: "Un perro mestizo de 3 años",
    horasSoloAlDia: 3,
    disponibilidadTiempo: "Trabajo en la mañana y mis hijos llegan del colegio a las 14:00.",
    motivoAdopcion: "Mis hijos quieren una gatita y tenemos experiencia cuidando mascotas.",
    estado: "CERRADA",
    fechaResolucion: enChile("2026-11-10 12:00"),
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

  // ---------- TURNOS E INSCRIPCIONES ----------
  // Las fechas son relativas a "hoy" para que el seed siempre deje turnos
  // futuros. Se calculan en UTC: 12:00 UTC equivale a las 09:00 en Chile
  // durante el horario de verano (UTC-3), que es cuando se presenta el proyecto.
  const DIA_MS = 24 * 60 * 60 * 1000;
  const horaUtc = (diasDesdeHoy, hora) => {
    const fecha = new Date(Date.now() + diasDesdeHoy * DIA_MS);
    fecha.setUTCHours(hora, 0, 0, 0);
    return fecha;
  };
  // La fecha limite de inscripcion es el final de ese dia en Chile: 23:59 en
  // UTC-3 es 02:59 UTC del dia siguiente.
  const finDelDia = (diasDesdeHoy) => {
    const fecha = new Date(Date.now() + diasDesdeHoy * DIA_MS);
    fecha.setUTCHours(26, 59, 0, 0);
    return fecha;
  };

  // 1. Turno normal con un cupo ya tomado por Martina.
  const turnoPaseo = await prisma.turno.create({
    data: {
      titulo: "Paseo de perros",
      descripcion: "Paseo por el cerro con los perros del refugio.",
      inicio: horaUtc(3, 12),
      termino: horaUtc(3, 14),
      fechaLimiteInscripcion: finDelDia(2),
      cupoMaximo: 5,
      cuposDisponibles: 4,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  // 2. Se solapa con el turno 1: sirve para probar el rechazo por choque de horario.
  await prisma.turno.create({
    data: {
      titulo: "Limpieza de caniles",
      descripcion: "Limpieza y desinfeccion de los caniles.",
      inicio: horaUtc(3, 13),
      termino: horaUtc(3, 15),
      fechaLimiteInscripcion: finDelDia(2),
      cupoMaximo: 4,
      cuposDisponibles: 4,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  // 3. Martina se inscribio y despues cancelo: sirve para probar que se puede
  //    volver a inscribir y que el historial conserva ambos movimientos.
  const turnoGatos = await prisma.turno.create({
    data: {
      titulo: "Alimentacion de gatos",
      descripcion: "Reparto de comida y agua en la gatera.",
      inicio: horaUtc(5, 19),
      termino: horaUtc(5, 21),
      fechaLimiteInscripcion: finDelDia(4),
      cupoMaximo: 3,
      cuposDisponibles: 3,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  // 4. Cupo unico y ya tomado por Diego: sirve para probar "turno lleno".
  const turnoBano = await prisma.turno.create({
    data: {
      titulo: "Jornada de bano",
      descripcion: "Bano de los perros que estan en proceso de adopcion.",
      inicio: horaUtc(7, 12),
      termino: horaUtc(7, 16),
      fechaLimiteInscripcion: finDelDia(6),
      cupoMaximo: 1,
      cuposDisponibles: 0,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  // 5. La fecha limite ya paso aunque el turno aun no empieza: sirve para
  //    probar el rechazo por inscripciones cerradas.
  await prisma.turno.create({
    data: {
      titulo: "Feria de adopcion",
      descripcion: "Stand del refugio en la plaza.",
      inicio: horaUtc(2, 14),
      termino: horaUtc(2, 18),
      fechaLimiteInscripcion: finDelDia(-1),
      cupoMaximo: 6,
      cuposDisponibles: 6,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  // 6. Turno que ya empezo: no se puede modificar ni cancelar la inscripcion.
  const turnoVacunacion = await prisma.turno.create({
    data: {
      titulo: "Jornada de vacunacion",
      descripcion: "Apoyo a la veterinaria durante la vacunacion.",
      inicio: horaUtc(-2, 12),
      termino: horaUtc(-2, 15),
      fechaLimiteInscripcion: finDelDia(-3),
      cupoMaximo: 5,
      cuposDisponibles: 4,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  const inscripcionPaseoMartina = await prisma.inscripcionTurno.create({
    data: { turnoId: turnoPaseo.id, voluntarioId: Martina.id },
  });
  await prisma.historialInscripcion.create({
    data: {
      inscripcionId: inscripcionPaseoMartina.id,
      accion: "INSCRIPCION",
      turnoId: turnoPaseo.id,
      realizadoPorId: cuentaVoluntaria.id,
    },
  });

  const inscripcionGatosMartina = await prisma.inscripcionTurno.create({
    data: {
      turnoId: turnoGatos.id,
      voluntarioId: Martina.id,
      estado: "CANCELADA",
      canceladaEn: new Date(),
    },
  });
  await prisma.historialInscripcion.create({
    data: {
      inscripcionId: inscripcionGatosMartina.id,
      accion: "INSCRIPCION",
      turnoId: turnoGatos.id,
      realizadoPorId: cuentaVoluntaria.id,
    },
  });
  await prisma.historialInscripcion.create({
    data: {
      inscripcionId: inscripcionGatosMartina.id,
      accion: "CANCELACION",
      turnoId: turnoGatos.id,
      realizadoPorId: cuentaVoluntaria.id,
    },
  });

  const inscripcionBanoDiego = await prisma.inscripcionTurno.create({
    data: { turnoId: turnoBano.id, voluntarioId: Diego.id },
  });
  await prisma.historialInscripcion.create({
    data: {
      inscripcionId: inscripcionBanoDiego.id,
      accion: "INSCRIPCION",
      turnoId: turnoBano.id,
      realizadoPorId: cuentaVoluntario.id,
    },
  });

  const inscripcionVacunacionMartina = await prisma.inscripcionTurno.create({
    data: { turnoId: turnoVacunacion.id, voluntarioId: Martina.id },
  });
  await prisma.historialInscripcion.create({
    data: {
      inscripcionId: inscripcionVacunacionMartina.id,
      accion: "INSCRIPCION",
      turnoId: turnoVacunacion.id,
      realizadoPorId: cuentaVoluntaria.id,
    },
  });

  // 7. Turno cancelado por la encargada (por lluvia). Martina estaba inscrita: su
  //    inscripcion quedo CANCELADA con el motivo en el historial. Sirve para ver
  //    el bloque gris punteado en el calendario y el motivo en el panel.
  const turnoCancelado = await prisma.turno.create({
    data: {
      titulo: "Jornada de adopcion en la plaza",
      descripcion: "Stand del refugio en la plaza de armas.",
      inicio: horaUtc(4, 13),
      termino: horaUtc(4, 17),
      fechaLimiteInscripcion: finDelDia(3),
      cupoMaximo: 4,
      cuposDisponibles: 3,
      estado: "CANCELADO",
      motivoCancelacion: "Se suspende por lluvia",
      canceladoEn: new Date(),
      canceladoPorId: cuentaEncargada.id,
      publicadoPorId: cuentaEncargada.id,
    },
  });
  const inscripcionCanceladaPorRefugio = await prisma.inscripcionTurno.create({
    data: {
      turnoId: turnoCancelado.id,
      voluntarioId: Martina.id,
      estado: "CANCELADA",
      canceladaEn: new Date(),
    },
  });
  await prisma.historialInscripcion.createMany({
    data: [
      {
        inscripcionId: inscripcionCanceladaPorRefugio.id,
        accion: "INSCRIPCION",
        turnoId: turnoCancelado.id,
        realizadoPorId: cuentaVoluntaria.id,
      },
      {
        inscripcionId: inscripcionCanceladaPorRefugio.id,
        accion: "CANCELACION",
        turnoId: turnoCancelado.id,
        detalle: "Turno cancelado por el refugio: Se suspende por lluvia",
        realizadoPorId: cuentaEncargada.id,
      },
    ],
  });

  // 8. Turno de la semana pasada en que Martina estuvo: sirve para retroceder
  //    una semana en el calendario (historial de la encargada y RF15).
  const turnoSemanaPasada = await prisma.turno.create({
    data: {
      titulo: "Limpieza general",
      descripcion: "Limpieza general del refugio.",
      inicio: horaUtc(-8, 13),
      termino: horaUtc(-8, 16),
      fechaLimiteInscripcion: finDelDia(-9),
      cupoMaximo: 6,
      cuposDisponibles: 5,
      publicadoPorId: cuentaEncargada.id,
    },
  });
  const inscripcionSemanaPasada = await prisma.inscripcionTurno.create({
    data: { turnoId: turnoSemanaPasada.id, voluntarioId: Martina.id },
  });
  await prisma.historialInscripcion.create({
    data: {
      inscripcionId: inscripcionSemanaPasada.id,
      accion: "INSCRIPCION",
      turnoId: turnoSemanaPasada.id,
      realizadoPorId: cuentaVoluntaria.id,
    },
  });

  // 9. Diego se inscribio en el paseo y despues se cambio a este turno: sirve
  //    para ver una MODIFICACION en el historial ("De ... a ...").
  const turnoCachorros = await prisma.turno.create({
    data: {
      titulo: "Socializacion de cachorros",
      descripcion: "Juego y socializacion con los cachorros recien llegados.",
      inicio: horaUtc(4, 18),
      termino: horaUtc(4, 20),
      fechaLimiteInscripcion: finDelDia(3),
      cupoMaximo: 5,
      cuposDisponibles: 4,
      publicadoPorId: cuentaEncargada.id,
    },
  });
  const inscripcionCachorrosDiego = await prisma.inscripcionTurno.create({
    data: { turnoId: turnoCachorros.id, voluntarioId: Diego.id },
  });
  await prisma.historialInscripcion.createMany({
    data: [
      {
        inscripcionId: inscripcionCachorrosDiego.id,
        accion: "INSCRIPCION",
        turnoId: turnoPaseo.id,
        realizadoPorId: cuentaVoluntario.id,
      },
      {
        inscripcionId: inscripcionCachorrosDiego.id,
        accion: "MODIFICACION",
        turnoId: turnoCachorros.id,
        turnoAnteriorId: turnoPaseo.id,
        realizadoPorId: cuentaVoluntario.id,
      },
    ],
  });

  // 10. Turno de la tarde-noche (21:00 a 23:00 en Chile): sirve para ver que la
  //     grilla se agranda para mostrarlo.
  await prisma.turno.create({
    data: {
      titulo: "Ronda nocturna",
      descripcion: "Revision de los caniles y la gatera antes de cerrar.",
      inicio: horaUtc(6, 24),
      termino: horaUtc(6, 26),
      fechaLimiteInscripcion: finDelDia(5),
      cupoMaximo: 2,
      cuposDisponibles: 2,
      publicadoPorId: cuentaEncargada.id,
    },
  });

  // 11. Turno de la semana siguiente, libre: sirve para avanzar en el calendario.
  await prisma.turno.create({
    data: {
      titulo: "Paseo de perros",
      descripcion: "Paseo por el cerro con los perros del refugio.",
      inicio: horaUtc(10, 12),
      termino: horaUtc(10, 14),
      fechaLimiteInscripcion: finDelDia(9),
      cupoMaximo: 5,
      cuposDisponibles: 5,
      publicadoPorId: cuentaEncargada.id,
    },
  });


  await prisma.postulacionVoluntario.create({
    data: {
      nombre: "Diego Fuentes",
      email: "diego@refugio.cl",
      telefono: "955512345",
      diasDisponibles: ["SABADO", "DOMINGO"],
      motivacion: "Quiero ayudar a los perros a encontrar un hogar.",
      habilidades: ["CUIDADO_ANIMALES", "TRANSPORTE"],
      estado: "ACEPTADA",
      fechaRevision: new Date("2026-09-15"),
      revisadaPorId: cuentaEncargada.id,
      voluntarioId: Diego.id,
    },
  });

  await prisma.postulacionVoluntario.create({
    data: {
      nombre: "Ignacio Perez",
      email: "ignacio.perez@gmail.com",
      telefono: "944433322",
      diasDisponibles: ["MIERCOLES"],
      motivacion: "Necesito horas de voluntariado para la universidad.",
      habilidades: ["LIMPIEZA"],
      estado: "RECHAZADA",
      motivoRechazo: "Solo puede un dia y el refugio necesita al menos dos dias por semana.",
      fechaRevision: new Date("2026-10-10"),
      revisadaPorId: cuentaEncargada.id,
    },
  });

  await prisma.postulacionVoluntario.create({
    data: {
      nombre: "Camila Soto",
      email: "camila.soto@gmail.com",
      telefono: "933322211",
      diasDisponibles: ["LUNES", "MIERCOLES", "VIERNES"],
      motivacion: "Estudio veterinaria y me gustaria aprender ayudando en el refugio.",
      habilidades: ["APOYO_VETERINARIO", "CUIDADO_ANIMALES"],
    },
  });

  await prisma.postulacionVoluntario.create({
    data: {
      nombre: "Sofia Muñoz",
      email: "sofia.munoz@gmail.com",
      telefono: "922211100",
      diasDisponibles: ["SABADO"],
      motivacion: "Me encantan los gatos y se hacer videos para redes sociales.",
      habilidades: ["DIFUSION_REDES", "OTRA"],
      otraHabilidad: "Fotografia",
    },
  });

  console.log("Seed completado");
  console.log(`  Usuarios: ${cuentaDirectora.email}, ${cuentaVeterinaria.email}, ${cuentaVoluntaria.email}, ${cuentaVoluntario.email}, ${cuentaEncargada.email}`);
  console.log("  Turnos: 11 (futuros, solapados, lleno, cerrado, ya iniciado, cancelado, semana pasada, con cambio, nocturno y semana siguiente)");
  console.log(`  Registros medicos: ${revisionInicialGretel.id ? 2 : 0} (Gretel ACTUALIZADO, Galileo PROVISIONAL)`);
  console.log(`  Revision completa de Gretel (id): ${revisionCompletaGretel.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
