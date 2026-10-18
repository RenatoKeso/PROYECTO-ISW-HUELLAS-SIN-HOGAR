-- r4 exige guardar la fecha de actualizacion separada de la de creacion.
-- Nullable: mientras el voluntario no use su unica actualizacion permitida,
-- la columna queda en null y eso es justamente lo que el servicio usa para
-- saber que la revision inicial sigue disponible.
ALTER TABLE "RevisionInicial" ADD COLUMN "fechaActualizacion" TIMESTAMP(3);
