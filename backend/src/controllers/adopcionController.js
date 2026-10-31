import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  obtenerCatalogo,
  obtenerDetallePostulacion,
  obtenerPostulaciones,
  registrarPostulacion,
  resolverPostulacion,
} from "../services/adopcionService.js";

const MENSAJE_CATALOGO = "Animales en adopcion obtenidos correctamente";

export function crearAdopcionController({
  obtenerCatalogoAdopcion = obtenerCatalogo,
  registrarPostulacionAdopcion = registrarPostulacion,
  obtenerPostulacionesAdopcion = obtenerPostulaciones,
  obtenerDetalle = obtenerDetallePostulacion,
  resolverPostulacionAdopcion = resolverPostulacion,
} = {}) {
  return {
    async listarAnimales(request, response) {
      const animales = await obtenerCatalogoAdopcion();

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_CATALOGO,
        datos: { animales },
      });
    },

    async crearPostulacion(request, response) {
      const postulacion = await registrarPostulacionAdopcion(request.body);

      return enviarRespuestaExitosa(response, {
        mensaje: "Postulacion enviada correctamente",
        estado: 201,
        datos: { postulacion },
      });
    },

    async listarPostulaciones(request, response) {
      const postulaciones = await obtenerPostulacionesAdopcion(request.query);

      return enviarRespuestaExitosa(response, {
        mensaje: "Postulaciones obtenidas correctamente",
        datos: { postulaciones },
      });
    },

    async verPostulacion(request, response) {
      const detalle = await obtenerDetalle(request.params.id);

      return enviarRespuestaExitosa(response, {
        mensaje: "Postulacion obtenida correctamente",
        datos: detalle,
      });
    },

    async resolverPostulacion(request, response) {
      const postulacion = await resolverPostulacionAdopcion(
        request.params.id,
        request.body,
        request.usuario,
      );

      return enviarRespuestaExitosa(response, {
        mensaje:
          postulacion.estado === "APROBADA"
            ? "Postulacion aprobada"
            : "Postulacion rechazada",
        datos: { postulacion },
      });
    },
  };
}