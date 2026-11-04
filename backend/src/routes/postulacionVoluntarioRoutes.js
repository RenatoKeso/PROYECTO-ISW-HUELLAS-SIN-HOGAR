import { Router } from "express";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { puedeRevisarPostulacionesVoluntario } from "../services/permisosUsuario.js";
import { postulacionIdParamSchema } from "../validations/adopcionValidation.js";
import {
  postulacionVoluntarioSchema,
  listarPostulacionesVoluntarioQuerySchema,
  revisarPostulacionVoluntarioSchema,
} from "../validations/postulacionVoluntarioValidation.js";
import { postular, listar, revisar, deshacer } from "../controllers/postulacionVoluntarioController.js";

export function crearPostulacionVoluntarioRouter({ autenticar = crearAutenticacion() } = {}) {
  const router = Router();

  const soloEquipoVoluntariado = [autenticar, autorizarAccion(puedeRevisarPostulacionesVoluntario)];

 
  router.post("/", validarEsquema(postulacionVoluntarioSchema), capturarErrores(postular));

  router.get(
    "/",
    ...soloEquipoVoluntariado,
    validarEsquema(listarPostulacionesVoluntarioQuerySchema, "query"),
    capturarErrores(listar),
  );

  router.patch(
    "/:id/revision",
    ...soloEquipoVoluntariado,
    validarEsquema(postulacionIdParamSchema, "params"),
    validarEsquema(revisarPostulacionVoluntarioSchema),
    capturarErrores(revisar),
  );

  router.patch(
    "/:id/deshacer",
    ...soloEquipoVoluntariado,
    validarEsquema(postulacionIdParamSchema, "params"),
    capturarErrores(deshacer),
  );

  return router;
}