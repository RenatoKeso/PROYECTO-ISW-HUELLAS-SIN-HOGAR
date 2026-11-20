import servicioPorDefecto from "../services/planSanitarioService.js";

export function crearPlanSanitarioController(
  servicio = servicioPorDefecto
) {
  return {
    async agenda(req, res) {
      res.json(await servicio.agenda(req.query));
    },

    async buscarAnimales(req, res) {
      res.json(await servicio.buscarAnimales(req.query));
    },

    async consultar(req, res) {
      res.json(
        await servicio.consultar(req.params.codigo)
      );
    },

    async programar(req, res) {
      res.status(201).json({
        atencion: await servicio.programar(
          req.params.codigo,
          req.body
        ),
      });
    },

    async modificar(req, res) {
      res.json({
        atencion: await servicio.modificar(
          req.params.id,
          req.body
        ),
      });
    },
  };
}