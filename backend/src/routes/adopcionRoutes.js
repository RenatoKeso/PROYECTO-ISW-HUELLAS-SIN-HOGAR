import { Router } from "express";
import { crearAdopcionController } from "../controllers/adopcionController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { puedeGestionarAdopciones } from "../services/permisosUsuario.js";
import {
  listarPostulacionesQuerySchema,
  postulacionCreateSchema,
  postulacionIdParamSchema,
  resolverPostulacionSchema,
} from "../validations/adopcionValidation.js";

export function crearAdopcionRouter({
  controlador = crearAdopcionController(),
  autenticar = crearAutenticacion(),
} = {}) {
  const router = Router();

  // Primero se exige sesion y despues el rol: directora o encargada de adopciones.
  const soloEquipoAdopciones = [autenticar, autorizarAccion(puedeGestionarAdopciones)];

  // ---------- Publicas: cualquier persona ----------
  router.get("/animales", capturarErrores(controlador.listarAnimales));

  router.post(
    "/postulaciones",
    validarEsquema(postulacionCreateSchema),
    capturarErrores(controlador.crearPostulacion),
  );

  // ---------- Equipo de adopciones ----------
  router.get(
    "/postulaciones",
    ...soloEquipoAdopciones,
    validarEsquema(listarPostulacionesQuerySchema, "query"),
    capturarErrores(controlador.listarPostulaciones),
  );

  router.get(
    "/postulaciones/:id",
    ...soloEquipoAdopciones,
    validarEsquema(postulacionIdParamSchema, "params"),
    capturarErrores(controlador.verPostulacion),
  );

  router.patch(
    "/postulaciones/:id/resolucion",
    ...soloEquipoAdopciones,
    validarEsquema(postulacionIdParamSchema, "params"),
    validarEsquema(resolverPostulacionSchema),
    capturarErrores(controlador.resolverPostulacion),
  );

  return router;
}

export default crearAdopcionRouter();