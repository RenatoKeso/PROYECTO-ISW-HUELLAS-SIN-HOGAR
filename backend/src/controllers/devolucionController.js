import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  registrarDevolucion,
  obtenerPostulacionesEntregadas,
} from "../services/devolucionService.js";

export async function registrar(request, response) {
  const { devolucion, aviso } = await registrarDevolucion(request.body);

  return enviarRespuestaExitosa(response, {
    mensaje: "Devolución registrada correctamente",
    estado: 201,
    datos: { devolucion, aviso },
  });
}

export async function listarPostulacionesEntregadas(request, response) {
  const postulaciones = await obtenerPostulacionesEntregadas();

  return enviarRespuestaExitosa(response, {
    mensaje: "Postulaciones entregadas obtenidas correctamente",
    datos: { postulaciones },
  });
}
