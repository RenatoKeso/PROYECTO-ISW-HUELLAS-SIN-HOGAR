-- AlterTable
ALTER TABLE "Turno" ADD COLUMN     "canceladoEn" TIMESTAMP(3),
ADD COLUMN     "canceladoPorId" INTEGER,
ADD COLUMN     "motivoCancelacion" TEXT;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
