import { Router } from "express";
import saludRoutes from "./salud.routes.js";

const router = Router();

router.use("/salud", saludRoutes);

export default router;