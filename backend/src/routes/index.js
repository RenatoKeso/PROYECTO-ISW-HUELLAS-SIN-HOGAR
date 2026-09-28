import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { crearAnimalRouter } from "./animalRoutes.js";
import { crearVoluntarioRouter } from "./voluntarioRoutes.js";

export function crearRouter({ registrarIngresoAnimal } = {}) {
  const router = Router();

  router.use(
    crearAnimalRouter({
      controlador: crearAnimalController({ registrarIngresoAnimal }),
    }),
  );
  router.use(crearVoluntarioRouter());
  
  return router;
}

export default crearRouter();
