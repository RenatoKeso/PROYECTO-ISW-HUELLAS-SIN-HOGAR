-- CreateEnum
CREATE TYPE "MotivoDevolucion" AS ENUM ('COMPORTAMIENTO', 'SALUD', 'CAMBIO_SITUACION_FAMILIAR', 'OTRO');

-- CreateTable
CREATE TABLE "Devolucion" (
    "id" SERIAL NOT NULL,
    "fichaAnimalId" INTEGER NOT NULL,
    "receptorId" INTEGER NOT NULL,
    "postulacionId" INTEGER NOT NULL,
    "fechaDevolucion" TIMESTAMP(3) NOT NULL,
    "motivo" "MotivoDevolucion" NOT NULL,
    "detalle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devolucion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_fichaAnimalId_fkey" FOREIGN KEY ("fichaAnimalId") REFERENCES "FichaAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucion" ADD CONSTRAINT "Devolucion_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
