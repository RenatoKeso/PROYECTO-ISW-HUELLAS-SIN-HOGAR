import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { crearAnimalRouter } from "./animalRoutes.js";

export function crearRouter({ registrarIngresoAnimal } = {}) {
  const router = Router();

  router.use(
    crearAnimalRouter({
      controlador: crearAnimalController({ registrarIngresoAnimal }),
    }),
  );

  return router;
}

export default crearRouter();
