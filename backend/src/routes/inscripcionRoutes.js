import { Router } from "express";
import { crearInscripcionController } from "../controllers/inscripcionController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { puedeGestionarInscripciones } from "../services/permisosUsuario.js";
import {
  inscripcionCreateSchema,
  inscripcionIdSchema,
  inscripcionUpdateSchema,
  misInscripcionesQuerySchema,
} from "../validations/inscripcionValidation.js";

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

  // Mis inscripciones, con filtro opcional ?estado=ACTIVA|CANCELADA.
  router.get(
    "/mias",
    validarEsquema(misInscripcionesQuerySchema, "query"),
    capturarErrores(controlador.listarMias),
  );

  router.get(
    "/:id/historial",
    validarEsquema(inscripcionIdSchema, "params"),
    capturarErrores(controlador.verHistorial),
  );

  // Cancelar una inscripcion propia. Es PATCH porque la inscripcion no se borra:
  // cambia de estado y conserva su historial.
  router.patch(
    "/:id/cancelacion",
    validarEsquema(inscripcionIdSchema, "params"),
    capturarErrores(controlador.cancelar),
  );

  // Cambiar una inscripcion propia a otro turno.
  router.patch(
    "/:id",
    validarEsquema(inscripcionIdSchema, "params"),
    validarEsquema(inscripcionUpdateSchema),
    capturarErrores(controlador.modificar),
  );

  return router;
}
