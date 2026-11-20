import servicio from "../services/donacionService.js";
import { DonacionError } from "../entities/donacionErrors.js";

export function crearDonacionController(
  donaciones = servicio
) {
  return {
    async registrar(req, res) {
      res.status(201).json(
        await donaciones.registrar(req.body)
      );
    },

    async animales(req, res) {
      res.json(
        await donaciones.animales(req.query)
      );
    },

    async listar(req, res) {
      res.json(
        await donaciones.listar(req.query)
      );
    },

    async revisar(req, res) {
      res.json(
        await donaciones.revisar(
          req.params.folio,
          req.body,
          req.usuario
        )
      );
    },

    async comprobante(req, res) {
      const archivo =
        await donaciones.comprobante(
          req.params.folio
        );

      res
        .set({
          "Content-Type": "application/pdf",
          "Content-Disposition":
            `attachment; filename="comprobante-${req.params.folio}.pdf"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        })
        .send(archivo);
    },

    eliminar() {
      throw new DonacionError(
        "Las donaciones registradas se conservan y no se pueden eliminar",
        405,
        "DONACION_ELIMINACION_BLOQUEADA"
      );
    },
  };
}