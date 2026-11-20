import { Router } from "express";
import { crearDonacionController } from "../controllers/donacionController.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { puedeGestionarDonaciones } from "../services/permisosUsuario.js";
import { folioDonacionSchema } from "../validations/donacionValidation.js";

export function crearDonacionRouter({
  autenticar,
  servicio,
} = {}) {
  const router = Router();
  const controlador =
    crearDonacionController(servicio);

  router.post(
    "/",
    capturarErrores(controlador.registrar)
  );

  router.get(
    "/animales",
    capturarErrores(controlador.animales)
  );

  router.use(
    autenticar,
    autorizarAccion(puedeGestionarDonaciones)
  );

  router.get(
    "/",
    capturarErrores(controlador.listar)
  );

  router.patch(
    "/:folio/revision",
    validarEsquema(
      folioDonacionSchema,
      "params"
    ),
    capturarErrores(controlador.revisar)
  );

  router.get(
    "/:folio/comprobante",
    validarEsquema(
      folioDonacionSchema,
      "params"
    ),
    capturarErrores(controlador.comprobante)
  );

  router.delete(
    "/:folio",
    validarEsquema(
      folioDonacionSchema,
      "params"
    ),
    capturarErrores(controlador.eliminar)
  );

  return router;
}