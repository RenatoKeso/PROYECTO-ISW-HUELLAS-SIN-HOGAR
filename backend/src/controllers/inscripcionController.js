import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import { inscribirseEnTurno } from "../services/inscripcionService.js";

export function crearInscripcionController({
  inscribirse = inscribirseEnTurno,
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
  };
}
