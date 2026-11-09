import { Router } from "express";
import { crearAnimalController } from "../controllers/animalController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { recibirImagen } from "../middlewares/subirImagenAnimal.js";
import { validarCreacionFicha } from "../middlewares/validarCreacionFicha.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import {
  fichaAnimalUpdateSchema,
  fichaIdParamSchema,
} from "../validations/fichaAnimalValidation.js";
import { registroIngresoSchema } from "../validations/registroIngresoValidation.js";
import { listarIngresosQuerySchema } from "../validations/ingresoAnimalValidation.js";

export function crearAnimalRouter({ controlador = crearAnimalController() } = {}) {
  const router = Router();

  router.post(
    "/fichas",
    recibirImagen("imagen"),
    validarCreacionFicha,
    capturarErrores(controlador.crearFicha),
  );

  router.get("/fichas", capturarErrores(controlador.listarFichas));

  router.get(
    "/animales/ingresos",
    validarEsquema(listarIngresosQuerySchema, "query"),
    capturarErrores(controlador.listarTodosLosIngresos),
  );

  router.post(
    "/fichas/:id/imagen",
    validarEsquema(fichaIdParamSchema, "params"),
    recibirImagen("imagen"),
    capturarErrores(controlador.subirImagen),
  );

  router.delete(
    "/fichas/:id/imagen",
    validarEsquema(fichaIdParamSchema, "params"),
    capturarErrores(controlador.quitarImagen),
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
