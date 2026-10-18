import authService, {usuarioPublico,} from "../services/authService.js";

export function crearAuthController(servicio = authService) {
return {
    async login(req, res, next) {
        try {
        res.set("Cache-Control", "no-store");
        res.json(await servicio.login(req.body));
    } catch (error) {
        next(error);
    }
},

    me(req, res) {
        res.set("Cache-Control", "no-store");

        res.json({
        usuario: usuarioPublico(req.usuario),
    });
},

    async logout(req, res, next) {
        try {
        await servicio.logout(req.usuario.id);

        res.json({
            message: "Sesiones cerradas correctamente",
        });
    } catch (error) {
        next(error);
        }
    },
};
}