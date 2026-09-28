import { Router } from "express";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import { listarVoluntarios } from "../repositories/voluntarioRepository.js";

const MENSAJE_LISTADO = "Voluntarios obtenidos correctamente";

export function crearVoluntarioRouter() {
  const router = Router();

  router.get(
    "/voluntarios",
    capturarErrores(async (request, response) => {
      const voluntarios = await listarVoluntarios();

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_LISTADO,
        datos: { voluntarios },
      });
    }),
  );

  return router;
}

export default crearVoluntarioRouter();