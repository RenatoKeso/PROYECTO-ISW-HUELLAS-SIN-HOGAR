import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  formalizarEntrega,
  obtenerAnimalesPublicables,
  obtenerCatalogo,
  obtenerDetallePostulacion,
  obtenerPostulaciones,
  omitirVisitaHogar,
  publicarAnimal,
  registrarPostulacion,
  registrarVisita,
  resolverPostulacion,
} from "../services/adopcionService.js";

const MENSAJE_CATALOGO = "Animales en adopcion obtenidos correctamente";

export function crearAdopcionController({
  obtenerCatalogoAdopcion = obtenerCatalogo,
  obtenerPublicables = obtenerAnimalesPublicables,
  publicarAnimalAdopcion = publicarAnimal,
  registrarPostulacionAdopcion = registrarPostulacion,
  obtenerPostulacionesAdopcion = obtenerPostulaciones,
  obtenerDetalle = obtenerDetallePostulacion,
  resolverPostulacionAdopcion = resolverPostulacion,
  registrarVisitaAdopcion = registrarVisita,
  omitirVisitaHogarAdopcion = omitirVisitaHogar,
  formalizarEntregaAdopcion = formalizarEntrega,
} = {}) {
  return {
    async listarAnimales(request, response) {
      const animales = await obtenerCatalogoAdopcion();

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_CATALOGO,
        datos: { animales },
      });
    },

    async listarPublicables(request, response) {
      const animales = await obtenerPublicables();

      return enviarRespuestaExitosa(response, {
        mensaje: "Animales listos para publicar obtenidos correctamente",
        datos: { animales },
      });
    },

    async publicarAnimal(request, response) {
      const animal = await publicarAnimalAdopcion(request.params.id);

      return enviarRespuestaExitosa(response, {
        mensaje: "Animal publicado en el catalogo de adopcion",
        datos: { animal },
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

    async registrarVisita(request, response) {
      const visita = await registrarVisitaAdopcion(
        request.params.id,
        request.body,
        request.usuario,
      );

      return enviarRespuestaExitosa(response, {
        mensaje: "Visita registrada correctamente",
        estado: 201,
        datos: { visita },
      });
    },

    async omitirVisitaHogar(request, response) {
      const postulacion = await omitirVisitaHogarAdopcion(
        request.params.id,
        request.body,
        request.usuario,
      );

      return enviarRespuestaExitosa(response, {
        mensaje: "Omision de la visita al hogar registrada",
        datos: { postulacion },
      });
    },

    async formalizarEntrega(request, response) {
      const resultado = await formalizarEntregaAdopcion(request.params.id, request.body);

      return enviarRespuestaExitosa(response, {
        mensaje: "Entrega registrada: el animal quedo adoptado",
        datos: resultado,
      });
    },
  };
}