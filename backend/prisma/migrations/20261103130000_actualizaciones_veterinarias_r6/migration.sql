-- r6: actualizaciones veterinarias, historial y seguimientos.

-- Permite restaurar el estado estable al cancelar una edicion.
ALTER TABLE "RegistroMedicoAnimal"
ADD COLUMN "estadoPrevioRevision" "EstadoValidacionMedica";

-- El seguimiento registra las necesidades detectadas en la actualizacion.
ALTER TABLE "SeguimientoMedicoAnimal"
ADD COLUMN "necesidades" TEXT;

-- La version del historial conserva la observacion de seguimiento del momento.
ALTER TABLE "HistorialRegistroMedico"
ADD COLUMN "observacionSeguimiento" TEXT;
