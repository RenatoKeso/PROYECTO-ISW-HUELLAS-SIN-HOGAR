import { Router } from "express";
import { crearNotificacionController } from "../controllers/notificacionController.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { notificacionIdParamSchema } from "../validations/registroMedicoValidation.js";

export function crearNotificacionRouter({
  controlador = crearNotificacionController(),
  autenticar = crearAutenticacion(),
} = {}) {
  const router = Router();

  router.get(
    "/",
    autenticar,
    capturarErrores(controlador.listarNotificaciones),
  );

  router.patch(
    "/:id/leida",
    autenticar,
    validarEsquema(notificacionIdParamSchema, "params"),
    capturarErrores(controlador.marcarLeida),
  );

  return router;
}

export default crearNotificacionRouter();
