import { listarAnimalesDisponibles } from "../repositories/animalAdopcionRepository.js";
import {
  buscarAnimalPorId,
  buscarPostulacionAbierta,
  buscarPostulacionPorId,
  crearPostulacion,
  listarDevolucionesDelPostulante,
  listarPostulaciones,
  registrarAlertaMostrada,
  resolverPostulacionEnRevision,
} from "../repositories/postulacionRepository.js";
import {
  animalInexistente,
  animalNoDisponible,
  postulacionDuplicada,
  postulacionInexistente,
  postulacionYaResuelta,
} from "../entities/adopcionErrors.js";

const DEPENDENCIAS_POR_DEFECTO = {
  listarAnimalesDisponibles,
  buscarAnimalPorId,
  buscarPostulacionAbierta,
  buscarPostulacionPorId,
  crearPostulacion,
  listarDevolucionesDelPostulante,
  listarPostulaciones,
  registrarAlertaMostrada,
  resolverPostulacionEnRevision,
};

// Un animal solo recibe postulaciones mientras esta publicado en el catalogo.
const ESTADO_DISPONIBLE = "ESPERA_ADOPCION";

// Catalogo de adopcion: los animales que hoy pueden recibir postulaciones.
export async function obtenerCatalogo(dependencias = DEPENDENCIAS_POR_DEFECTO){
  return dependencias.listarAnimalesDisponibles();
}

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