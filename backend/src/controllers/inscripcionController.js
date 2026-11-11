import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  cancelarInscripcionEnTurno,
  inscribirseEnTurno,
  obtenerHistorialDeInscripcion,
  obtenerMisInscripciones,
} from "../services/inscripcionService.js";

export function crearInscripcionController({
  inscribirse = inscribirseEnTurno,
  obtenerMias = obtenerMisInscripciones,
  obtenerHistorial = obtenerHistorialDeInscripcion,
  cancelar = cancelarInscripcionEnTurno,
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

    async cancelar(request, response) {
      const inscripcion = await cancelar(request.params.id, request.usuario);

      return enviarRespuestaExitosa(response, {
        mensaje: "Inscripción cancelada correctamente",
        datos: { inscripcion },
      });
    },
  };
}
