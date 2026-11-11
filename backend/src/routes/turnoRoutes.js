import { Router } from "express";
import { crearTurnoController } from "../controllers/turnoController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import {
  puedeConsultarTurnos,
  puedeGestionarTurnos,
} from "../services/permisosUsuario.js";
import { turnoCreateSchema } from "../validations/turnoValidation.js";

export function crearTurnoRouter({
  controlador = crearTurnoController(),
  autenticar = crearAutenticacion(),
} = {}) {
  const router = Router();

  // Todas las rutas de turnos exigen sesion. Despues, cada una revisa su rol.
  
  router.use(autenticar);

  // Quien publica y administra turnos: directora y encargada de voluntariado.
  
  router.post(
    "/",
    autorizarAccion(puedeGestionarTurnos),
    validarEsquema(turnoCreateSchema),
    capturarErrores(controlador.publicarTurno),
  );

  router.get(
    "/gestion",
    autorizarAccion(puedeGestionarTurnos),
    capturarErrores(controlador.listarGestion),
  );

  // Turnos que se pueden elegir: los ven quienes los publican y los voluntarios.

  router.get(
    "/",
    autorizarAccion(puedeConsultarTurnos),
    capturarErrores(controlador.listarDisponibles),
  );

  return router;
}