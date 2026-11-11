DELETE FROM "ReporteDevolucion";
-- DropForeignKey
ALTER TABLE "ReporteDevolucion" DROP CONSTRAINT "ReporteDevolucion_generadoPorId_fkey";

-- AddForeignKey
ALTER TABLE "ReporteDevolucion" ADD CONSTRAINT "ReporteDevolucion_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
