import { Router } from "express";
import { crearAuthController } from "../controllers/authController.js";
import { crearAutenticacion } from "../middlewares/autenticarUsuario.js";
import authService from "../services/authService.js";

// Límite por IP para una instancia del backend.
function limitarLogin() {
    const intentos = new Map();

    return (req, res, next) => {
    const ahora = Date.now();

    for (const [ip, dato] of intentos) {
    if (dato.hasta <= ahora) {
        intentos.delete(ip);
    }
}

    const dato = intentos.get(req.ip) ?? {
        cantidad: 0,
        hasta: ahora + 900000,
    };

    if (dato.cantidad >= 20 ||(!intentos.has(req.ip) && intentos.size >= 10000)
    ) {
        res.set("Retry-After", "900");

    return res.status(429).json({
        message: "Demasiados intentos. Intenta más tarde",
        code: "LIMITE_LOGIN",
    });
}

    dato.cantidad += 1;
    intentos.set(req.ip, dato);

    next();
    };
}

export function crearAuthRouter(servicio = authService) {
    const router = Router();
    const controlador = crearAuthController(servicio);
    const autenticar = crearAutenticacion(servicio);

    router.post("/login", limitarLogin(), controlador.login);

    router.get("/me", autenticar, controlador.me);

    router.post("/logout", autenticar, controlador.logout);

    return router;
}