import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  obtenerInscritosDeTurno,
  obtenerTurnosDisponibles,
  obtenerTurnosGestion,
  publicarTurno,
} from "../services/turnoService.js";
import { obtenerCalendarioVoluntario } from "../services/calendarioTurnosService.js";

export function crearTurnoController({
  publicarTurnoServicio = publicarTurno,
  obtenerGestion = obtenerTurnosGestion,
  obtenerDisponibles = obtenerTurnosDisponibles,
  obtenerCalendario = obtenerCalendarioVoluntario,
  obtenerInscritos = obtenerInscritosDeTurno,
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
      const { semana, turnos } = await obtenerGestion(request.query);

      return enviarRespuestaExitosa(response, {
        mensaje: "Turnos obtenidos correctamente",
        datos: semana ? { semana, turnos } : { turnos },
      });
    },

    async verInscritos(request, response) {
      const { turno, inscripciones } = await obtenerInscritos(request.params);

      return enviarRespuestaExitosa(response, {
        mensaje: "Inscritos obtenidos correctamente",
        datos: { turno, inscripciones },
      });
    },

    async listarDisponibles(request, response) {
      const turnos = await obtenerDisponibles();

      return enviarRespuestaExitosa(response, {
        mensaje: "Turnos disponibles obtenidos correctamente",
        datos: { turnos },
      });
    },

    async verCalendario(request, response) {
      const calendario = await obtenerCalendario(request.query, request.usuario);

      return enviarRespuestaExitosa(response, {
        mensaje: "Calendario obtenido correctamente",
        datos: calendario,
      });
    },
  };
}