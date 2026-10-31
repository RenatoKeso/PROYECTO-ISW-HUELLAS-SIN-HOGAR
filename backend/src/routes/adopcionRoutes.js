import { Router } from "express";
import { crearAdopcionController } from "../controllers/adopcionController.js";
import { capturarErrores } from "../middlewares/capturarErrores.js";
import { validarEsquema } from "../middlewares/validarEsquema.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import { autorizarAccion } from "../middlewares/autorizarAccion.js";
import { puedeGestionarAdopciones } from "../services/permisosUsuario.js";
import {
  animalIdParamSchema,
  entregaSchema,
  listarPostulacionesQuerySchema,
  omitirVisitaHogarSchema,
  postulacionCreateSchema,
  postulacionIdParamSchema,
  registrarVisitaSchema,
  resolverPostulacionSchema,
} from "../validations/adopcionValidation.js";

export function crearAdopcionRouter({
  controlador = crearAdopcionController(),
  autenticar = crearAutenticacion(),
} = {}) {
  const router = Router();

  // Primero se exige sesion y despues el rol: directora o encargada de adopciones.
  const soloEquipoAdopciones = [autenticar, autorizarAccion(puedeGestionarAdopciones)];
  const conPostulacionId = validarEsquema(postulacionIdParamSchema, "params");

  // ---------- Publicas: cualquier persona ----------
  router.get("/animales", capturarErrores(controlador.listarAnimales));

  router.post(
    "/postulaciones",
    validarEsquema(postulacionCreateSchema),
    capturarErrores(controlador.crearPostulacion),
  );

  // ---------- Equipo de adopciones: publicacion ----------
  router.get(
    "/animales/publicables",
    ...soloEquipoAdopciones,
    capturarErrores(controlador.listarPublicables),
  );

  router.patch(
    "/animales/:id/publicar",
    ...soloEquipoAdopciones,
    validarEsquema(animalIdParamSchema, "params"),
    capturarErrores(controlador.publicarAnimal),
  );

  // ---------- Equipo de adopciones: revision ----------
  router.get(
    "/postulaciones",
    ...soloEquipoAdopciones,
    validarEsquema(listarPostulacionesQuerySchema, "query"),
    capturarErrores(controlador.listarPostulaciones),
  );

  router.get(
    "/postulaciones/:id",
    ...soloEquipoAdopciones,
    conPostulacionId,
    capturarErrores(controlador.verPostulacion),
  );

  router.patch(
    "/postulaciones/:id/resolucion",
    ...soloEquipoAdopciones,
    conPostulacionId,
    validarEsquema(resolverPostulacionSchema),
    capturarErrores(controlador.resolverPostulacion),
  );

  // ---------- Equipo de adopciones: visitas y entrega ----------
  router.post(
    "/postulaciones/:id/visitas",
    ...soloEquipoAdopciones,
    conPostulacionId,
    validarEsquema(registrarVisitaSchema),
    capturarErrores(controlador.registrarVisita),
  );

  router.post(
    "/postulaciones/:id/omision-visita",
    ...soloEquipoAdopciones,
    conPostulacionId,
    validarEsquema(omitirVisitaHogarSchema),
    capturarErrores(controlador.omitirVisitaHogar),
  );

  router.post(
    "/postulaciones/:id/entrega",
    ...soloEquipoAdopciones,
    conPostulacionId,
    validarEsquema(entregaSchema),
    capturarErrores(controlador.formalizarEntrega),
  );

  return router;
}

export default crearAdopcionRouter();