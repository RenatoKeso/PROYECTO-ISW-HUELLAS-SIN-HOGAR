import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import {
  fichaAnimalUpdateSchema,
  fichaCreateSchema,
  fichaIdParamSchema,
} from "../validations/fichaAnimalValidation.js";
import { registroIngresoSchema } from "../validations/registroIngresoValidation.js";

export function crearAnimalRouter({ controlador = crearAnimalController() } = {}) {
  const router = Router();

  router.post(
    "/fichas",
    validarEsquema(fichaCreateSchema),
    capturarErrores(controlador.crearFicha),
  );

  router.patch(
    "/fichas/:id",
    validarEsquema(fichaIdParamSchema, "params"),
    validarEsquema(fichaAnimalUpdateSchema),
    capturarErrores(controlador.actualizarFicha),
  );

  router.post(
    "/animales/ingresos",
    validarEsquema(registroIngresoSchema),
    capturarErrores(controlador.registrarIngreso),
  );

  router.get(
    "/animales/:id/ingresos",
    validarEsquema(fichaIdParamSchema, "params"),
    capturarErrores(controlador.listarIngresos),
  );

  return router;
}

export default crearAnimalRouter();
