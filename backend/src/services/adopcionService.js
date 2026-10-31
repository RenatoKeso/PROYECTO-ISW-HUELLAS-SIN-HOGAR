import { Prisma } from "@prisma/client";
import { ejecutarEnTransaccion } from "../config/prisma.js";
import {
  buscarAnimalParaPublicar,
  listarAnimalesDisponibles,
  listarAnimalesPublicables,
  publicarAnimalAdoptable,
} from "../repositories/animalAdopcionRepository.js";
import {
  buscarAnimalPorId,
  buscarPostulacionAbierta,
  buscarPostulacionPorId,
  cerrarOtrasPostulacionesAbiertas,
  crearPostulacion,
  crearSeguimientos,
  crearVisita,
  listarDevolucionesDelPostulante,
  listarPostulaciones,
  marcarAnimalAdoptado,
  marcarPostulacionEntregada,
  registrarAlertaMostrada,
  registrarOmisionVisitaHogar,
  resolverPostulacionEnRevision,
} from "../repositories/postulacionRepository.js";
import {
  animalInexistente,
  animalNoDisponible,
  animalNoPublicable,
  entregaNoPermitida,
  fechaInvalida,
  postulacionDuplicada,
  postulacionInexistente,
  postulacionNoAprobada,
  postulacionYaResuelta,
  primeraVisitaPendiente,
  visitaHogarYaResuelta,
  visitaYaRegistrada,
} from "../entities/adopcionErrors.js";
import { diaEnChile } from "../validations/adopcionValidation.js";

const DEPENDENCIAS_POR_DEFECTO = {
  listarAnimalesDisponibles,
  listarAnimalesPublicables,
  buscarAnimalParaPublicar,
  publicarAnimalAdoptable,
  buscarAnimalPorId,
  buscarPostulacionAbierta,
  buscarPostulacionPorId,
  crearPostulacion,
  listarDevolucionesDelPostulante,
  listarPostulaciones,
  registrarAlertaMostrada,
  resolverPostulacionEnRevision,
  crearVisita,
  registrarOmisionVisitaHogar,
  marcarPostulacionEntregada,
  marcarAnimalAdoptado,
  cerrarOtrasPostulacionesAbiertas,
  crearSeguimientos,
  ejecutarEnTransaccion,
};

// Un animal solo recibe postulaciones mientras esta publicado en el catalogo.
const ESTADO_DISPONIBLE = "ESPERA_ADOPCION";

// Al entregar se programan dos seguimientos: a los 15 y a los 30 dias.
const DIAS_SEGUIMIENTO = [15, 30];
const UN_DIA_MS = 24 * 60 * 60 * 1000;
const CODIGO_CONFLICTO_UNICO = "P2002";

// Las fechas sin hora se guardan a medianoche UTC: su dia es "AAAA-MM-DD" en UTC.
function diaDeFechaSinHora(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function buscarVisita(postulacion, tipo) {
  return postulacion.visitas?.find((visita) => visita.tipo === tipo) ?? null;
}

function visitaHogarResuelta(postulacion) {
  return Boolean(
    buscarVisita(postulacion, "VISITA_HOGAR") || postulacion.motivoOmisionVisitaHogar,
  );
}

// ---------- Catalogo y publicacion ----------

// Catalogo de adopcion: los animales que hoy pueden recibir postulaciones.
export async function obtenerCatalogo(dependencias = DEPENDENCIAS_POR_DEFECTO){
  return dependencias.listarAnimalesDisponibles();
}

// Animales adoptables que todavia no estan publicados.
export async function obtenerAnimalesPublicables(dependencias = DEPENDENCIAS_POR_DEFECTO) {
  return dependencias.listarAnimalesPublicables();
}

// Publicar = pasar un animal ACTIVO y ADOPTABLE a ESPERA_ADOPCION (aparece en el catalogo).
export async function publicarAnimal(id, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  const animal = await dependencias.buscarAnimalParaPublicar(id);

  if (!animal) throw animalInexistente(id);

  if (animal.estadoEstadia === ESTADO_DISPONIBLE) {
    throw animalNoPublicable("El animal ya esta publicado en el catalogo");
  }

  if (animal.estadoAdopcion !== "ADOPTABLE") {
    throw animalNoPublicable(
      "La veterinaria todavia no evalua a este animal como adoptable",
    );
  }

  if (animal.estadoEstadia !== "ACTIVO") {
    throw animalNoPublicable("Solo se pueden publicar animales que estan en el refugio");
  }

  const cambios = await dependencias.publicarAnimalAdoptable(id);

  if (cambios === 0) {
    throw animalNoPublicable("El animal cambio de estado mientras se publicaba");
  }

  return { ...animal, estadoEstadia: ESTADO_DISPONIBLE };
}

// ---------- Postulaciones ----------

// Guarda la postulacion que envia un interesado desde el formulario publico.
export async function registrarPostulacion(datos, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  const animal = await dependencias.buscarAnimalPorId(datos.fichaAnimalId);

  if (!animal) throw animalInexistente(datos.fichaAnimalId);
  if (animal.estadoEstadia !== ESTADO_DISPONIBLE) throw animalNoDisponible();

  const abierta = await dependencias.buscarPostulacionAbierta({
    fichaAnimalId: datos.fichaAnimalId,
    rutPostulante: datos.rutPostulante,
  });

  if (abierta) throw postulacionDuplicada();

  return dependencias.crearPostulacion(datos);
}

export async function obtenerPostulaciones(filtros = {}, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  return dependencias.listarPostulaciones(filtros);
}

// Detalle para la revision. Si el postulante tiene devoluciones anteriores,
// se informan como alerta (no bloquean la decision) y se guarda la primera
// vez que la alerta se mostro.
export async function obtenerDetallePostulacion(id, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  const postulacion = await dependencias.buscarPostulacionPorId(id);

  if (!postulacion) throw postulacionInexistente(id);

  const devoluciones = await dependencias.listarDevolucionesDelPostulante(
    postulacion.rutPostulante,
  );

  let alertaMostradaEn = postulacion.alertaMostradaEn;

  if (devoluciones.length > 0 && !alertaMostradaEn) {
    alertaMostradaEn = new Date();
    await dependencias.registrarAlertaMostrada(id, alertaMostradaEn);
  }

  return {
    postulacion: { ...postulacion, alertaMostradaEn },
    antecedentes: {
      tieneDevoluciones: devoluciones.length > 0,
      cantidad: devoluciones.length,
      devoluciones,
    },
  };
}

// Aprueba o rechaza una postulacion que sigue en revision.
export async function resolverPostulacion(
  id,
  { decision, observaciones },
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const postulacion = await dependencias.buscarPostulacionPorId(id);

  if (!postulacion) throw postulacionInexistente(id);
  if (postulacion.estado !== "EN_REVISION") throw postulacionYaResuelta();

  // No tiene sentido aprobar si el animal ya no esta en el catalogo.
  if (
    decision === "APROBADA" &&
    postulacion.fichaAnimal.estadoEstadia !== ESTADO_DISPONIBLE
  ) {
    throw animalNoDisponible();
  }

  const cambios = await dependencias.resolverPostulacionEnRevision(id, {
    estado: decision,
    fechaResolucion: new Date(),
    // El revisor es un Voluntario. Si la cuenta no tiene uno asociado
    // (por ejemplo, la directora), queda vacio.
    revisorId: usuario?.voluntarioId ?? null,
    ...(observaciones ? { observaciones } : {}),
  });

  if (cambios === 0) throw postulacionYaResuelta();

  return dependencias.buscarPostulacionPorId(id);
}

// ---------- Visitas ----------

async function obtenerPostulacionAprobada(id, dependencias) {
  const postulacion = await dependencias.buscarPostulacionPorId(id);

  if (!postulacion) throw postulacionInexistente(id);
  if (postulacion.estado !== "APROBADA") throw postulacionNoAprobada();

  return postulacion;
}

function exigirPrimeraVisitaFavorable(postulacion) {
  const primera = buscarVisita(postulacion, "PRIMERA_VISITA");

  if (!primera || primera.resultado !== "FAVORABLE") throw primeraVisitaPendiente();

  return primera;
}

// Registra la primera visita o la visita al hogar. La visita al hogar solo se
// registra despues de una primera visita favorable.
export async function registrarVisita(
  id,
  { tipo, fechaVisita, resultado, observaciones },
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const postulacion = await obtenerPostulacionAprobada(id, dependencias);

  let fechaMinima = postulacion.fechaResolucion ? diaEnChile(postulacion.fechaResolucion) : "";
  let mensajeFecha = "La visita no puede ser anterior a la aprobacion de la postulacion";

  if (tipo === "PRIMERA_VISITA") {
    if (buscarVisita(postulacion, "PRIMERA_VISITA")) throw visitaYaRegistrada();
  } else {
    const primera = exigirPrimeraVisitaFavorable(postulacion);

    if (visitaHogarResuelta(postulacion)) throw visitaHogarYaResuelta();

    const diaPrimera = diaDeFechaSinHora(primera.fechaVisita);
    if (diaPrimera > fechaMinima) {
      fechaMinima = diaPrimera;
      mensajeFecha = "La visita al hogar no puede ser anterior a la primera visita";
    }
  }

  if (diaDeFechaSinHora(fechaVisita) < fechaMinima) throw fechaInvalida(mensajeFecha);

  try {
    return await dependencias.crearVisita({
      postulacionId: id,
      tipo,
      fechaVisita,
      resultado,
      observaciones: observaciones ?? null,
      registradaPorId: usuario.id,
    });
  } catch (error) {
    // Dos personas registrando la misma visita al mismo tiempo.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === CODIGO_CONFLICTO_UNICO
    ) {
      throw visitaYaRegistrada();
    }

    throw error;
  }
}

// Omitir la visita al hogar exige un motivo de la lista y deja registrado
// quien la autorizo.
export async function omitirVisitaHogar(
  id,
  { motivo, observacion },
  usuario,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const postulacion = await obtenerPostulacionAprobada(id, dependencias);

  exigirPrimeraVisitaFavorable(postulacion);

  if (visitaHogarResuelta(postulacion)) throw visitaHogarYaResuelta();

  const cambios = await dependencias.registrarOmisionVisitaHogar(id, {
    motivoOmisionVisitaHogar: motivo,
    observacionOmisionVisitaHogar: observacion ?? null,
    fechaOmisionVisitaHogar: new Date(),
    omisionAutorizadaPorId: usuario.id,
  });

  if (cambios === 0) throw visitaHogarYaResuelta();

  return dependencias.buscarPostulacionPorId(id);
}

// ---------- Entrega ----------

// Revisa que se cumplan todas las condiciones antes de entregar.
function validarRequisitosEntrega(postulacion, fechaEntrega) {
  if (postulacion.estado === "ENTREGADA") {
    throw entregaNoPermitida("Esta postulacion ya fue entregada");
  }

  if (postulacion.estado !== "APROBADA") {
    throw entregaNoPermitida("Solo se puede entregar una postulacion aprobada");
  }

  const primera = buscarVisita(postulacion, "PRIMERA_VISITA");

  if (!primera) {
    throw entregaNoPermitida("Falta registrar la primera visita entre el animal y la familia");
  }

  if (primera.resultado !== "FAVORABLE") {
    throw entregaNoPermitida("La primera visita no fue favorable");
  }

  const hogar = buscarVisita(postulacion, "VISITA_HOGAR");

  if (!hogar && !postulacion.motivoOmisionVisitaHogar) {
    throw entregaNoPermitida("Falta registrar u omitir la visita al hogar");
  }

  if (hogar && hogar.resultado !== "FAVORABLE") {
    throw entregaNoPermitida("La visita al hogar no fue favorable");
  }

  if (postulacion.fichaAnimal.estadoEstadia !== ESTADO_DISPONIBLE) {
    throw animalNoDisponible();
  }

  const ultimaVisita = [primera, hogar]
    .filter(Boolean)
    .map((visita) => diaDeFechaSinHora(visita.fechaVisita))
    .sort()
    .at(-1);

  if (diaDeFechaSinHora(fechaEntrega) < ultimaVisita) {
    throw fechaInvalida("La entrega no puede ser anterior a las visitas registradas");
  }
}

// Formaliza la entrega. Todo ocurre en una sola transaccion: si algo falla,
// no se guarda nada.
//  - la postulacion queda ENTREGADA (con fecha y documentacion)
//  - el animal queda ADOPTADO, asi sale del catalogo
//  - las demas postulaciones abiertas del animal se cierran
//  - se programan los seguimientos de 15 y 30 dias
export async function formalizarEntrega(
  id,
  { fechaEntrega, documentacionEntregada },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const postulacion = await dependencias.buscarPostulacionPorId(id);

  if (!postulacion) throw postulacionInexistente(id);

  validarRequisitosEntrega(postulacion, fechaEntrega);

  const seguimientos = DIAS_SEGUIMIENTO.map((dias) => ({
    postulacionId: id,
    diasDesdeEntrega: dias,
    fechaProgramada: new Date(fechaEntrega.getTime() + dias * UN_DIA_MS),
  }));

  const postulacionesCerradas = await dependencias.ejecutarEnTransaccion(async (cliente) => {
    const entregadas = await dependencias.marcarPostulacionEntregada(
      id,
      { fechaEntrega, documentacionEntregada },
      cliente,
    );

    if (entregadas === 0) {
      throw entregaNoPermitida("La postulacion cambio de estado, vuelve a cargarla");
    }

    const adoptados = await dependencias.marcarAnimalAdoptado(postulacion.fichaAnimalId, cliente);

    if (adoptados === 0) throw animalNoDisponible();

    const cerradas = await dependencias.cerrarOtrasPostulacionesAbiertas(
      {
        fichaAnimalId: postulacion.fichaAnimalId,
        postulacionEntregadaId: id,
        fecha: new Date(),
      },
      cliente,
    );

    await dependencias.crearSeguimientos(seguimientos, cliente);

    return cerradas;
  });

  return {
    postulacion: await dependencias.buscarPostulacionPorId(id),
    postulacionesCerradas,
  };
}