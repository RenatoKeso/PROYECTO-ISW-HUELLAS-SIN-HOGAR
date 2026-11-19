-- CreateEnum
CREATE TYPE "TenenciaVivienda" AS ENUM ('PROPIA', 'ARRENDADA', 'OTRA');

-- AlterTable
ALTER TABLE "Postulacion" ADD COLUMN     "comunaPostulante" TEXT,
ADD COLUMN     "direccionPostulante" TEXT,
ADD COLUMN     "fechaNacimientoPostulante" DATE,
ADD COLUMN     "hayNinos" BOOLEAN,
ADD COLUMN     "horasSoloAlDia" INTEGER,
ADD COLUMN     "motivoAdopcion" TEXT,
ADD COLUMN     "permiteMascotasArriendo" BOOLEAN,
ADD COLUMN     "personasHogar" INTEGER,
ADD COLUMN     "tenenciaVivienda" "TenenciaVivienda",
ADD COLUMN     "tienePatio" BOOLEAN;
