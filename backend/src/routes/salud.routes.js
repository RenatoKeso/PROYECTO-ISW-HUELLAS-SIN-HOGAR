import { Router } from "express";
import { previsualizarAlertas } from "../controllers/salud.controller.js";
import { TIPOS } from "../services/alertasSanitarias.service.js";

const router = Router();

router.get("/tipos", (request, response) => {
    response.json({ tipos: [...TIPOS] });
});

router.post("/alertas/preview", previsualizarAlertas);

export default router;