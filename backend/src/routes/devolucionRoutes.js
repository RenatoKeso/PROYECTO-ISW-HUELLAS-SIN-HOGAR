import { Router } from "express";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { devolucionSchema } from "../validations/devolucionValidation.js";
import { registrar, listarPostulacionesEntregadas } from "../controllers/devolucionController.js";

export function crearDevolucionRouter() {
  const router = Router();

  router.get(
    "/devoluciones/postulaciones-entregadas",
    capturarErrores(listarPostulacionesEntregadas),
  );

  router.post(
    "/devoluciones",
    validarEsquema(devolucionSchema),
    capturarErrores(registrar),
  );

  return router;
}