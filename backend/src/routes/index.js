import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { crearAnimalRouter } from "./animalRoutes.js";
import { crearVoluntarioRouter } from "./voluntarioRoutes.js";
import { crearReporteDevolucionRouter } from "./reporteDevolucionRoutes.js";
import { crearDevolucionRouter } from "./devolucionRoutes.js";
import { crearSaludRouter } from "./salud.routes.js";
import { crearAdopcionRouter } from "./adopcionRoutes.js";
import { crearPostulacionVoluntarioRouter } from "./postulacionVoluntarioRoutes.js";
import { crearAuthRouter } from "./authRoutes.js";
import { crearTurnoRouter } from "./turnoRoutes.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import {
  puedeConsultarAlertas,
  puedeConsultarReportesDevolucion,
  puedeConsultarVoluntarios,
  puedeGestionarFichas,
  puedeRegistrarDevoluciones,
} from "../services/permisosUsuario.js";
import authService from "../services/authService.js";
import { crearRegistroMedicoRouter } from "./registroMedicoRoutes.js";
import { crearNotificacionRouter } from "./notificacionRoutes.js";

export function crearRouter({
  registrarIngresoAnimal,
  servicioAuth = authService,
  consultarAlertas,
  servicioPlan,
} = {}) {
  const router = Router();
  const autenticar = crearAutenticacion(servicioAuth);

  router.use("/auth", crearAuthRouter(servicioAuth));

  router.use(
    "/adopciones",
    crearAdopcionRouter({ autenticar })
  );

  
  router.use(
    "/postulaciones-voluntario",
    crearPostulacionVoluntarioRouter({ autenticar })
  );

  router.use(
    "/turnos",
    crearTurnoRouter({ autenticar })
  );

  router.use(
    ["/fichas", "/animales/ingresos", "/animales/:id/ingresos"],
    autenticar,
    autorizarAccion(puedeGestionarFichas)
  );

  router.use(
    crearAnimalRouter({
      controlador: crearAnimalController({
        registrarIngresoAnimal,
      }),
    })
  );

  router.use(
    "/voluntarios",
    autenticar,
    autorizarAccion(puedeConsultarVoluntarios)
  );

  router.use(crearVoluntarioRouter());

  router.use(
    "/salud",
    autenticar,
    autorizarAccion(puedeConsultarAlertas),
    crearSaludRouter({
      consultar: consultarAlertas,
      servicioPlan,
    })
  );

  router.use(
    "/reportes/devoluciones",
    autenticar,
    autorizarAccion(puedeConsultarReportesDevolucion)
  );

  router.use(crearReporteDevolucionRouter());

  router.use(
    "/registros-medicos",
    crearRegistroMedicoRouter({ autenticar })
  );

  router.use(
    "/notificaciones",
    crearNotificacionRouter({ autenticar })
  );

  router.use(
    "/devoluciones",
    autenticar,
    autorizarAccion(puedeRegistrarDevoluciones)
  );

  router.use(crearDevolucionRouter());

  return router;
}

export default crearRouter();
