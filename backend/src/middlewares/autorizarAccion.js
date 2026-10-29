import { AuthError } from "../entities/authErrors.js";

export function autorizarAccion(comprobarPermiso) {
    return (req, res, next) => {
        if (!req.usuario) {
            return next(
        new AuthError("Debes iniciar sesión")
    );
}

    if (!comprobarPermiso(req.usuario)) {
        return next(
            new AuthError(
                "No tienes permiso para realizar esta acción",
                    403,
                        "ACCESO_DENEGADO"
        )
    );
}

    next();
    };
}