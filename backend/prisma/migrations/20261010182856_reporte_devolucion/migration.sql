-- CreateTable
CREATE TABLE "ReporteDevolucion" (
    "id" SERIAL NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3) NOT NULL,
    "totalDevoluciones" INTEGER NOT NULL,
    "resultado" JSONB NOT NULL,
    "generadoPorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReporteDevolucion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReporteDevolucion" ADD CONSTRAINT "ReporteDevolucion_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
