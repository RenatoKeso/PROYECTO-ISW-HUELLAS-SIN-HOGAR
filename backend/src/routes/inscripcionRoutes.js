import { Router } from "express";
import { crearInscripcionController } from "../controllers/inscripcionController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { puedeGestionarInscripciones } from "../services/permisosUsuario.js";
import { inscripcionCreateSchema } from "../validations/inscripcionValidation.js";

export function crearInscripcionRouter({
  controlador = crearInscripcionController(),
  autenticar = crearAutenticacion(),
} = {}) {
  const router = Router();

  // Todas las rutas de inscripciones exigen sesion y ser voluntario o voluntario de confianza.
  router.use(autenticar);
  router.use(autorizarAccion(puedeGestionarInscripciones));

  router.post(
    "/",
    validarEsquema(inscripcionCreateSchema),
    capturarErrores(controlador.inscribirse),
  );

  return router;
}
