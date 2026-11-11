-- CreateEnum
CREATE TYPE "TipoAtencionSanitaria" AS ENUM ('vacuna', 'tratamiento', 'control', 'desparasitacion', 'esterilizacion');

-- CreateEnum
CREATE TYPE "EstadoAtencionSanitaria" AS ENUM ('PENDIENTE', 'REALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "AtencionSanitaria" (
    "id" SERIAL NOT NULL,
    "fichaAnimalId" INTEGER NOT NULL,
    "tipo" "TipoAtencionSanitaria" NOT NULL,
    "fechaProgramada" DATE NOT NULL,
    "estado" "EstadoAtencionSanitaria" NOT NULL DEFAULT 'PENDIENTE',
    "fechaRealizacion" DATE,
    "motivoCancelacion" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtencionSanitaria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtencionSanitaria_estado_fechaProgramada_idx" ON "AtencionSanitaria"("estado", "fechaProgramada");

-- CreateIndex
CREATE INDEX "AtencionSanitaria_fichaAnimalId_fechaProgramada_idx" ON "AtencionSanitaria"("fichaAnimalId", "fechaProgramada");

-- AddForeignKey
ALTER TABLE "AtencionSanitaria" ADD CONSTRAINT "AtencionSanitaria_fichaAnimalId_fkey" FOREIGN KEY ("fichaAnimalId") REFERENCES "FichaAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
