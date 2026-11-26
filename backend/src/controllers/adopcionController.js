import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import {
  avisarRechazoPorVisita,
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
import {
  enviarCorreoAprobacion,
  enviarCorreoRechazo,
  enviarCorreosAdoptadoPorOtro,
} from "../services/correoAdopcionService.js";

const MENSAJE_CATALOGO = "Animales en adopcion obtenidos correctamente";

// El correo se envia sin esperarlo: si Gmail falla, lo que se hizo ya quedo
// guardado y solo se deja el error en la consola. "cualCorreo" es para que el
// error diga que correo fallo (de aprobacion, de rechazo...).
function avisarSinEsperar(cualCorreo, enviar) {
  Promise.resolve()
    .then(enviar)
    .catch((error) => console.error(`No se pudo enviar el correo ${cualCorreo}:`, error.message));
}

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
  avisarAprobacion = enviarCorreoAprobacion,
  avisarRechazo = enviarCorreoRechazo,
  avisarRechazoVisita = avisarRechazoPorVisita,
  avisarAdoptadoPorOtro = enviarCorreosAdoptadoPorOtro,
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

      if (postulacion.estado === "APROBADA") {
        avisarSinEsperar("de aprobacion", () => avisarAprobacion(postulacion));
      } else if (postulacion.estado === "RECHAZADA") {
        avisarSinEsperar("de rechazo", () => avisarRechazo(postulacion));
      }

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

      // Una visita desfavorable rechaza la postulacion: se avisa con el motivo
      // que quedo en las observaciones de la visita.
      if (visita.resultado === "DESFAVORABLE") {
        avisarSinEsperar("de rechazo", () =>
          avisarRechazoVisita(request.params.id, visita.observaciones),
        );
      }

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
      const { postulacion, postulacionesCerradas } = await formalizarEntregaAdopcion(
        request.params.id,
        request.body,
      );

      // La entrega ya quedo guardada: recien ahora se avisa a los demas
      // postulantes. Si la transaccion hubiera fallado no se llega a esta linea,
      // asi que nadie recibe un aviso falso.
      avisarSinEsperar("de animal adoptado", () => avisarAdoptadoPorOtro(postulacionesCerradas));

      // Al frontend solo va cuantas se cerraron: no hace falta mandarle los
      // nombres ni los correos de los otros postulantes.
      return enviarRespuestaExitosa(response, {
        mensaje: "Entrega registrada: el animal quedo adoptado",
        datos: { postulacion, postulacionesCerradas: postulacionesCerradas.length },
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
