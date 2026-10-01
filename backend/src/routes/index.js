import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { crearAnimalRouter } from "./animalRoutes.js";
import { crearVoluntarioRouter } from "./voluntarioRoutes.js";
import saludRoutes from "./salud.routes.js";
export function crearRouter({ registrarIngresoAnimal } = {}) {
  const router = Router();

  router.use(
    crearAnimalRouter({
      controlador: crearAnimalController({ registrarIngresoAnimal }),
    }),
  );
  router.use(crearVoluntarioRouter());
  router.use("/salud", saludRoutes);
  
  return router;
}

export default crearRouter();
