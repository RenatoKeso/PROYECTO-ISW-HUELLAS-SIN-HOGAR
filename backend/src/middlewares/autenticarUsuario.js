import authService from "../services/authService.js";
import { AuthError } from "../entities/authErrors.js";

export function crearAutenticacion(servicio = authService) {
    return async (req, res, next) => {
    try {
        const cabecera = req.get("Authorization") ?? "";
        const coincidencia =/^Bearer ([A-Za-z0-9_.-]+)$/.exec(cabecera);

    if (
        !coincidencia ||
        coincidencia[1].length > 4096
    ) {
        throw new AuthError("Debes iniciar sesión");
    }

    req.usuario = await servicio.autenticar(coincidencia[1]);

    next();
    } catch (error) {
    next(error);
        }
    };
}

export default crearAutenticacion();