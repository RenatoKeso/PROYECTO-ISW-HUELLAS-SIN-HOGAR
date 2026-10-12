import { Router } from "express";
import {previsualizarAlertas,} from "../controllers/salud.controller.js";

import {crearConsultaAlertasPlan,} from "../controllers/alertasPlan.controller.js";
import {TIPOS,} from "../services/alertasSanitarias.service.js";

export function crearSaludRouter({ consultar } = {}) {
    const router = Router();

    router.get("/tipos", (request, response) => {
    response.json({ tipos: [...TIPOS] });
});

    router.post("/alertas/preview", previsualizarAlertas);

    router.get(
    "/alertas",
    crearConsultaAlertasPlan(consultar)
);

    return router;
}

export default crearSaludRouter();