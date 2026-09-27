-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('EN_REVISION', 'APROBADA', 'RECHAZADA', 'CERRADA', 'ENTREGADA');

-- CreateEnum
CREATE TYPE "TipoVivienda" AS ENUM ('CASA', 'DEPARTAMENTO', 'OTRO');

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" SERIAL NOT NULL,
    "fichaAnimalId" INTEGER NOT NULL,
    "nombrePostulante" TEXT NOT NULL,
    "rutPostulante" TEXT NOT NULL,
    "telefonoPostulante" TEXT NOT NULL,
    "emailPostulante" TEXT,
    "revisorId" INTEGER,
    "tipoVivienda" "TipoVivienda" NOT NULL,
    "otrasMascotas" TEXT,
    "disponibilidadTiempo" TEXT NOT NULL,
    "fechaResolucion" TIMESTAMP(3),
    "observaciones" TEXT,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'EN_REVISION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Postulacion_fichaAnimalId_idx" ON "Postulacion"("fichaAnimalId");

-- CreateIndex
CREATE INDEX "Postulacion_estado_idx" ON "Postulacion"("estado");

-- CreateIndex
CREATE INDEX "Postulacion_rutPostulante_idx" ON "Postulacion"("rutPostulante");

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_fichaAnimalId_fkey" FOREIGN KEY ("fichaAnimalId") REFERENCES "FichaAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "Voluntario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
