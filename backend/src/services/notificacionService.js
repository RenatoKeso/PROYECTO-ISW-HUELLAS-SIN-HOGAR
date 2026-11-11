import { notificacionInexistente } from "../entities/notificacionErrors.js";
import {
  listarNotificacionesPorDestinatario,
  marcarNotificacionLeida,
} from "../repositories/notificacionRepository.js";

const DEPENDENCIAS_POR_DEFECTO = {
  listarNotificacionesPorDestinatario,
  marcarNotificacionLeida,
};

export async function listarNotificaciones(
  { actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  return dependencias.listarNotificacionesPorDestinatario(actor.id);
}

export async function marcarNotificacionComoLeida(
  { notificacionId, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const actualizadas = await dependencias.marcarNotificacionLeida(
    notificacionId,
    actor.id,
  );

  if (actualizadas === 0) {
    throw notificacionInexistente(notificacionId);
  }

  return { id: notificacionId, leida: true };
}
