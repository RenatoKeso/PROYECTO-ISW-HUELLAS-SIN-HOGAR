import { Router } from "express";
import { previsualizarAlertas } from "../controllers/salud.controller.js";

const router = Router();

router.post("/alertas/preview", previsualizarAlertas);

export default router;