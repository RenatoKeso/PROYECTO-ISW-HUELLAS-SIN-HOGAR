import { Router } from "express";
import { crearTurnoController } from "../controllers/turnoController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import {
  puedeConsultarTurnos,
  puedeGestionarInscripciones,
  puedeGestionarTurnos,
} from "../services/permisosUsuario.js";
import {
  calendarioQuerySchema,
  gestionQuerySchema,
  turnoCancelacionSchema,
  turnoCreateSchema,
  turnoIdSchema,
} from "../validations/turnoValidation.js";

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

  // ?semana=2026-11-16 opcional: la semana de su lunes, tambien semanas pasadas.
  router.get(
    "/gestion",
    autorizarAccion(puedeGestionarTurnos),
    validarEsquema(gestionQuerySchema, "query"),
    capturarErrores(controlador.listarGestion),
  );

  // Cancelar un turno. Es PATCH y no DELETE: el turno no se borra, cambia de
  // estado y conserva su historial (igual que una inscripcion cancelada).
  router.patch(
    "/:id/cancelacion",
    autorizarAccion(puedeGestionarTurnos),
    validarEsquema(turnoIdSchema, "params"),
    validarEsquema(turnoCancelacionSchema),
    capturarErrores(controlador.cancelar),
  );

  router.get(
    "/:id/inscritos",
    autorizarAccion(puedeGestionarTurnos),
    validarEsquema(turnoIdSchema, "params"),
    capturarErrores(controlador.verInscritos),
  );

  // Calendario semanal del voluntario: cada turno con su estado para el.
  // GET /turnos/calendario?semana=2026-11-16 (la fecha del lunes).

  router.get(
    "/calendario",
    autorizarAccion(puedeGestionarInscripciones),
    validarEsquema(calendarioQuerySchema, "query"),
    capturarErrores(controlador.verCalendario),
  );

  // Turnos que se pueden elegir: los ven quienes los publican y los voluntarios.

  router.get(
    "/",
    autorizarAccion(puedeConsultarTurnos),
    capturarErrores(controlador.listarDisponibles),
  );

  return router;
}