import { Router } from "express";
import { previsualizarAlertas } from "../controllers/salud.controller.js";
import { crearConsultaAlertasPlan } from "../controllers/alertasPlan.controller.js";
import { crearPlanSanitarioController } from "../controllers/planSanitarioController.js";
import { TIPOS } from "../services/alertasSanitarias.service.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import {codigoPlanSchema,idAtencionSchema,programarAtencionSchema,modificarAtencionSchema,} from "../validations/planSanitarioValidation.js";

export function crearSaludRouter({
  consultar,
  servicioPlan,
} = {}) {
  const router = Router();
  const plan = crearPlanSanitarioController(servicioPlan);

  router.get("/tipos", (request, response) => {
    response.json({ tipos: [...TIPOS] });
  });

  router.post(
    "/alertas/preview",
    previsualizarAlertas
  );

  router.get(
    "/alertas",
    crearConsultaAlertasPlan(consultar)
  );

  // crearRouter protege todo /salud con sesión
  // y permiso sanitario.
  router.get(
    "/plan/:codigo",
    validarEsquema(codigoPlanSchema, "params"),
    capturarErrores(plan.consultar)
  );

  router.post(
    "/plan/:codigo/atenciones",
    validarEsquema(codigoPlanSchema, "params"),
    validarEsquema(programarAtencionSchema),
    capturarErrores(plan.programar)
  );

  router.patch(
    "/atenciones/:id",
    validarEsquema(idAtencionSchema, "params"),
    validarEsquema(modificarAtencionSchema),
    capturarErrores(plan.modificar)
  );

  return router;
}

export default crearSaludRouter();