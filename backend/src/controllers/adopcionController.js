import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  formalizarEntrega,
  obtenerActaEntrega,
  obtenerCatalogo,
  obtenerDetallePostulacion,
  obtenerPostulaciones,
  omitirVisitaHogar,
  realizarSeguimiento,
  registrarPostulacion,
  registrarVisita,
  resolverPostulacion,
} from "../services/adopcionService.js";

const MENSAJE_CATALOGO = "Animales en adopcion obtenidos correctamente";

export function crearAdopcionController({
  obtenerCatalogoAdopcion = obtenerCatalogo,
  registrarPostulacionAdopcion = registrarPostulacion,
  obtenerPostulacionesAdopcion = obtenerPostulaciones,
  obtenerDetalle = obtenerDetallePostulacion,
  resolverPostulacionAdopcion = resolverPostulacion,
  registrarVisitaAdopcion = registrarVisita,
  omitirVisitaHogarAdopcion = omitirVisitaHogar,
  formalizarEntregaAdopcion = formalizarEntrega,
  realizarSeguimientoAdopcion = realizarSeguimiento,
  obtenerActa = obtenerActaEntrega,
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

    async registrarVisita(request, response) {
      const visita = await registrarVisitaAdopcion(
        request.params.id,
        request.body,
        request.usuario,
      );

      return enviarRespuestaExitosa(response, {
        mensaje:
          visita.resultado === "DESFAVORABLE"
            ? "Visita registrada: la postulacion quedo rechazada"
            : "Visita registrada correctamente",
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

    // Responde el PDF como archivo para descargar (igual que el reporte de devoluciones).
    async descargarActaEntrega(request, response) {
      const { pdf, nombreArchivo } = await obtenerActa(request.params.id);

      response.setHeader("Content-Type", "application/pdf");
      response.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);
      return response.send(pdf);
    },

    async realizarSeguimiento(request, response) {
      const postulacion = await realizarSeguimientoAdopcion(
        request.params.id,
        request.params.seguimientoId,
      );

      return enviarRespuestaExitosa(response, {
        mensaje: "Seguimiento marcado como realizado",
        datos: { postulacion },
      });
    },
  };
}
