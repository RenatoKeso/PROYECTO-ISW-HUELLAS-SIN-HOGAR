import { Router } from "express";
import { crearAdopcionController } from "../controllers/adopcionController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";

export function crearAdopcionRouter({ controlador = crearAdopcionController() } = {}) {
  const router = Router();

  router.get("/animales", capturarErrores(controlador.listarAnimales));

  return router;
}

export default crearAdopcionRouter();