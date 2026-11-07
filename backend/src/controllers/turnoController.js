import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  obtenerTurnosDisponibles,
  obtenerTurnosGestion,
  publicarTurno,
} from "../services/turnoService.js";

export function crearTurnoController({
  publicarTurnoServicio = publicarTurno,
  obtenerGestion = obtenerTurnosGestion,
  obtenerDisponibles = obtenerTurnosDisponibles,
} = {}) {
  return {
    async publicarTurno(request, response) {
      const turno = await publicarTurnoServicio(request.body, request.usuario);

      return enviarRespuestaExitosa(response, {
        mensaje: "Turno publicado correctamente",
        estado: 201,
        datos: { turno },
      });
    },

    async listarGestion(request, response) {
      const turnos = await obtenerGestion();

      return enviarRespuestaExitosa(response, {
        mensaje: "Turnos obtenidos correctamente",
        datos: { turnos },
      });
    },

    async listarDisponibles(request, response) {
      const turnos = await obtenerDisponibles();

      return enviarRespuestaExitosa(response, {
        mensaje: "Turnos disponibles obtenidos correctamente",
        datos: { turnos },
      });
    },
  };
}