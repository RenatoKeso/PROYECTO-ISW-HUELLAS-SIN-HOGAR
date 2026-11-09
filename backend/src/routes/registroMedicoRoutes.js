import { Router } from "express";
import { crearRegistroMedicoController } from "../controllers/registroMedicoController.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import {
  actualizacionVeterinariaSchema,
  registroMedicoIdParamSchema,
  revisionFinalSchema,
  revisionInicialSchema,
} from "../validations/registroMedicoValidation.js";

export function crearRegistroMedicoRouter({
  controlador = crearRegistroMedicoController(),
  autenticar = crearAutenticacion(),
} = {}) {
  const router = Router();

  router.post(
    "/:id/revision-inicial",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    validarEsquema(revisionInicialSchema),
    capturarErrores(controlador.completarRevisionInicial),
  );

  router.patch(
    "/:id/revision-inicial",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    validarEsquema(revisionInicialSchema),
    capturarErrores(controlador.actualizarRevisionInicial),
  );

  router.post(
    "/:id/validacion",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    validarEsquema(revisionFinalSchema),
    capturarErrores(controlador.realizarRevisionFinal),
  );

  router.post(
    "/:id/actualizaciones/inicio",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    capturarErrores(controlador.iniciarActualizacion),
  );

  router.post(
    "/:id/actualizaciones",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    validarEsquema(actualizacionVeterinariaSchema),
    capturarErrores(controlador.actualizarRegistro),
  );

  router.post(
    "/:id/actualizaciones/cancelar",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    capturarErrores(controlador.cancelarActualizacion),
  );

  router.get(
    "/:id/historial",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    capturarErrores(controlador.listarHistorial),
  );

  router.get(
    "/:id/seguimientos",
    autenticar,
    validarEsquema(registroMedicoIdParamSchema, "params"),
    capturarErrores(controlador.listarSeguimientos),
  );

  return router;
}

export default crearRegistroMedicoRouter();
