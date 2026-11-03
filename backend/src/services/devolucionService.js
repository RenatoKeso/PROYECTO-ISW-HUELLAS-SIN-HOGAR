import { ejecutarEnTransaccion } from "../config/prisma.js";
import {
  buscarPostulacionParaDevolucion,
  buscarVoluntarioActivo,
  contarDevolucionesPorMotivo,
  crearDevolucion,
  marcarAnimalActivo,
  cerrarPostulacionEntregada,
  listarPostulacionesEntregadas,
} from "../repositories/devolucionRepository.js";
import {
  postulacionNoEncontrada,
  devolucionNoPermitida,
  fechaDevolucionInvalida,
  receptorInvalido,
} from "../entities/devolucionErrors.js";

const DEPENDENCIAS_POR_DEFECTO = {
  buscarPostulacionParaDevolucion,
  buscarVoluntarioActivo,
  contarDevolucionesPorMotivo,
  crearDevolucion,
  marcarAnimalActivo,
  cerrarPostulacionEntregada,
  ejecutarEnTransaccion,
};

function armarAviso(animal, anteriores) {
  if (anteriores === 0) return null;

  const nombre = animal.nombre ?? animal.codigoAnimal;
  const veces = anteriores === 1 ? "1 vez" : `${anteriores} veces`;
  return `${nombre} ya había sido devuelto ${veces} por este mismo motivo`;
}

export async function registrarDevolucion(
  { postulacionId, receptorId, fechaDevolucion, motivo, detalle },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const {
    buscarPostulacionParaDevolucion,
    buscarVoluntarioActivo,
    contarDevolucionesPorMotivo,
    crearDevolucion,
    marcarAnimalActivo,
    cerrarPostulacionEntregada,
    ejecutarEnTransaccion,
  } = dependencias;

  const postulacion = await buscarPostulacionParaDevolucion(postulacionId);

  if (!postulacion) throw postulacionNoEncontrada(postulacionId);

  if (postulacion.estado !== "ENTREGADA") {
    throw devolucionNoPermitida("Solo se puede registrar la devolución de una postulación entregada");
  }

  if (postulacion.fichaAnimal.estadoEstadia !== "ADOPTADO") {
    throw devolucionNoPermitida("El animal de esta postulación no está adoptado");
  }

  if (postulacion.fechaEntrega && fechaDevolucion < postulacion.fechaEntrega) {
    throw fechaDevolucionInvalida("La fecha de devolución no puede ser anterior a la entrega");
  }

  const receptor = await buscarVoluntarioActivo(receptorId);

  if (!receptor) throw receptorInvalido();

  const anteriores = await contarDevolucionesPorMotivo(postulacion.fichaAnimalId, motivo);

  // Las 3 cosas pasan juntas: si una falla, no se guarda ninguna.
  const devolucion = await ejecutarEnTransaccion(async (cliente) => {
    const cerradas = await cerrarPostulacionEntregada(postulacionId, cliente);

    if (cerradas === 0) {
      throw devolucionNoPermitida("La postulación cambió de estado, vuelve a cargarla");
    }

    const activos = await marcarAnimalActivo(postulacion.fichaAnimalId, cliente);

    if (activos === 0) {
      throw devolucionNoPermitida("El animal cambió de estado, vuelve a cargarlo");
    }

    return crearDevolucion(
      {
        fichaAnimalId: postulacion.fichaAnimalId,
        receptorId,
        postulacionId,
        fechaDevolucion,
        motivo,
        detalle,
      },
      cliente,
    );
  });

  return { devolucion, aviso: armarAviso(postulacion.fichaAnimal, anteriores) };
}

export async function obtenerPostulacionesEntregadas() {
  return listarPostulacionesEntregadas();
}