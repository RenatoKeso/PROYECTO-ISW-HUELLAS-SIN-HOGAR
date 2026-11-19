import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  postularComoVoluntario,
  obtenerPostulacionesVoluntario,
  revisarPostulacionVoluntario,
  deshacerRevisionPostulacionVoluntario,
  obtenerCurriculum,
} from "../services/postulacionVoluntarioService.js";

export async function postular(request, response) {
  const postulacion = await postularComoVoluntario(request.body);

  return enviarRespuestaExitosa(response, {
    mensaje: "Postulación enviada correctamente",
    estado: 201,
    datos: { postulacion },
  });
}

export async function listar(request, response) {
  const postulaciones = await obtenerPostulacionesVoluntario(request.query.estado);

  return enviarRespuestaExitosa(response, {
    mensaje: "Postulaciones obtenidas correctamente",
    datos: { postulaciones },
  });
}

export async function revisar(request, response) {
  const postulacion = await revisarPostulacionVoluntario({
    postulacionId: request.params.id,
    decision: request.body.decision,
    motivoRechazo: request.body.motivoRechazo,
    revisadaPorId: request.usuario.id,
  });

  const mensaje =
    postulacion.estado === "ACEPTADA"
      ? "Postulación aceptada: ya es parte del voluntariado"
      : "Postulación rechazada";

  return enviarRespuestaExitosa(response, { mensaje, datos: { postulacion } });
}

export async function deshacer(request, response) {
  const postulacion = await deshacerRevisionPostulacionVoluntario(request.params.id);

  return enviarRespuestaExitosa(response, {
    mensaje: "Listo, la postulación volvió a En revisión",
    datos: { postulacion },
  });
}

export async function verCurriculum(request, response) {
  const { curriculum, curriculumNombre } = await obtenerCurriculum(request.params.id);

  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", `inline; filename="${curriculumNombre}"`);
  return response.send(Buffer.from(curriculum));
}
