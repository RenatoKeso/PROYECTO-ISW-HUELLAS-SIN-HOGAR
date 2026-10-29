-- CreateEnum
CREATE TYPE "EvolucionEstadoSalud" AS ENUM ('MEJORANDO', 'EMPEORANDO', 'ESTABLE');

-- AlterTable
-- La columna entra con un valor por defecto temporal para poder aplicar la
-- migracion sobre la fila existente de seguimiento, y despues se le quita el
-- default para que no se imponga en las filas siguientes.
ALTER TABLE "SeguimientoMedicoAnimal"
ADD COLUMN     "evolucionEstadoSalud" "EvolucionEstadoSalud" NOT NULL DEFAULT 'MEJORANDO';

-- AlterTable
ALTER TABLE "SeguimientoMedicoAnimal"
ALTER COLUMN "evolucionEstadoSalud" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SeguimientoMedicoAnimal" DROP COLUMN "necesidades";

-- AlterTable
ALTER TABLE "RegistroMedicoAnimal" DROP COLUMN "fechaCreacion";

-- AlterTable
ALTER TABLE "RevisionInicial" DROP COLUMN "fechaActualizacion";

-- AlterTable
ALTER TABLE "RevisionInicial" DROP COLUMN "peso";
