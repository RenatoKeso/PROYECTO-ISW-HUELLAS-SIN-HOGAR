import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  inscribirseEnTurno,
  obtenerHistorialDeInscripcion,
  obtenerMisInscripciones,
} from "../services/inscripcionService.js";

export function crearInscripcionController({
  inscribirse = inscribirseEnTurno,
  obtenerMias = obtenerMisInscripciones,
  obtenerHistorial = obtenerHistorialDeInscripcion,
} = {}) {
  return {
    async inscribirse(request, response) {
      const inscripcion = await inscribirse(request.body, request.usuario);

      return enviarRespuestaExitosa(response, {
        mensaje: "Inscripción realizada correctamente",
        estado: 201,
        datos: { inscripcion },
      });
    },

    async listarMias(request, response) {
      const inscripciones = await obtenerMias(request.query, request.usuario);

      return enviarRespuestaExitosa(response, {
        mensaje: "Inscripciones obtenidas correctamente",
        datos: { inscripciones },
      });
    },

    async verHistorial(request, response) {
      const { inscripcion, historial } = await obtenerHistorial(request.params.id, request.usuario);

      return enviarRespuestaExitosa(response, {
        mensaje: "Historial obtenido correctamente",
        datos: { inscripcion, historial },
      });
    },
  };
}
