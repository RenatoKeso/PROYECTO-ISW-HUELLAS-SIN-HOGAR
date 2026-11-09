import {
  listarNotificaciones,
  marcarNotificacionComoLeida,
} from "../services/notificacionService.js";
import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";

const MENSAJE_LISTAR = "Notificaciones obtenidas correctamente";
const MENSAJE_MARCAR_LEIDA = "Notificación marcada como leída";

export function crearNotificacionController({
  listar = listarNotificaciones,
  marcarLeida = marcarNotificacionComoLeida,
} = {}) {
  return {
    async listarNotificaciones(request, response) {
      const notificaciones = await listar({ actor: request.usuario });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_LISTAR,
        datos: { notificaciones },
      });
    },

    async marcarLeida(request, response) {
      const notificacion = await marcarLeida({
        notificacionId: request.params.id,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_MARCAR_LEIDA,
        datos: { notificacion },
      });
    },
  };
}
