import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import { obtenerCatalogo } from "../services/adopcionService.js";

const MENSAJE_CATALOGO = "Animales en adopcion obtenidos correctamente";

export function crearAdopcionController({ obtenerCatalogoAdopcion = obtenerCatalogo } = {}) {
  return {
    async listarAnimales(request, response) {
      const animales = await obtenerCatalogoAdopcion();

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_CATALOGO,
        datos: { animales },
      });
    },
  };
}