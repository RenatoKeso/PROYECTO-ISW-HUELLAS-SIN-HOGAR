import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { crearAnimalRouter } from "./animalRoutes.js";
import { crearVoluntarioRouter } from "./voluntarioRoutes.js";
import saludRoutes from "./salud.routes.js";
import { crearAdopcionRouter } from "./adopcionRoutes.js";
export function crearRouter({ registrarIngresoAnimal } = {}) {
  const router = Router();

  router.use(
    crearAnimalRouter({
      controlador: crearAnimalController({ registrarIngresoAnimal }),
    }),
  );
  router.use(crearVoluntarioRouter());
  router.use("/salud", saludRoutes);
  router.use("/adopciones", crearAdopcionRouter());
  return router;
}

export default crearRouter();
