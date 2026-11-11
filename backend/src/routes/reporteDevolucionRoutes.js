import { Router } from "express";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { reporteDevolucionSchema } from "../validations/reporteDevolucionValidation.js";
import { generarReporte, listarReportes } from "../controllers/reporteDevolucionController.js";

export function crearReporteDevolucionRouter() {
  const router = Router();

  router.post(
    "/reportes/devoluciones",
    validarEsquema(reporteDevolucionSchema),
    capturarErrores(generarReporte),
  );

  router.get("/reportes/devoluciones", capturarErrores(listarReportes));

  return router;
}