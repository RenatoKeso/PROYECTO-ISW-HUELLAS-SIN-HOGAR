import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { crearAnimalRouter } from "./animalRoutes.js";
import { crearVoluntarioRouter } from "./voluntarioRoutes.js";
import { crearReporteDevolucionRouter } from "./reporteDevolucionRoutes.js";
import { crearSaludRouter } from "./salud.routes.js";
import { crearAdopcionRouter } from "./adopcionRoutes.js";
import { crearAuthRouter } from "./authRoutes.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { puedeConsultarAlertas } from "../services/permisosUsuario.js";
import authService from "../services/authService.js";

export function crearRouter({
  registrarIngresoAnimal,
  servicioAuth = authService,
  consultarAlertas,
} = {}) {
  const router = Router();
  const autenticar = crearAutenticacion(servicioAuth);

  router.use("/auth", crearAuthRouter(servicioAuth));

  router.use(
    crearAnimalRouter({
      controlador: crearAnimalController({
        registrarIngresoAnimal,
      }),
    })
  );

  router.use(crearVoluntarioRouter());

  router.use(
    "/salud",
    autenticar,
    autorizarAccion(puedeConsultarAlertas),
    crearSaludRouter({
      consultar: consultarAlertas,
    })
  );

  router.use(crearReporteDevolucionRouter());
  router.use("/adopciones", crearAdopcionRouter());

  return router;
}

export default crearRouter();