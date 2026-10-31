-- CreateEnum
CREATE TYPE "TipoVisitaAdopcion" AS ENUM ('PRIMERA_VISITA', 'VISITA_HOGAR');

-- CreateEnum
CREATE TYPE "ResultadoVisitaAdopcion" AS ENUM ('FAVORABLE', 'DESFAVORABLE');

-- CreateEnum
CREATE TYPE "MotivoOmisionVisita" AS ENUM ('FALTA_ESPACIO_REFUGIO', 'POSTULANTE_CONOCIDO', 'DISTANCIA', 'SIN_PERSONAL_DISPONIBLE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoSeguimientoAdopcion" AS ENUM ('PENDIENTE', 'REALIZADO');

-- AlterTable
ALTER TABLE "Postulacion" ADD COLUMN     "documentacionEntregada" TEXT,
ADD COLUMN     "fechaEntrega" DATE,
ADD COLUMN     "fechaOmisionVisitaHogar" TIMESTAMP(3),
ADD COLUMN     "motivoOmisionVisitaHogar" "MotivoOmisionVisita",
ADD COLUMN     "observacionOmisionVisitaHogar" TEXT,
ADD COLUMN     "omisionAutorizadaPorId" INTEGER;

-- CreateTable
CREATE TABLE "VisitaAdopcion" (
    "id" SERIAL NOT NULL,
    "postulacionId" INTEGER NOT NULL,
    "tipo" "TipoVisitaAdopcion" NOT NULL,
    "fechaVisita" DATE NOT NULL,
    "resultado" "ResultadoVisitaAdopcion" NOT NULL,
    "observaciones" TEXT,
    "registradaPorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitaAdopcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoAdopcion" (
    "id" SERIAL NOT NULL,
    "postulacionId" INTEGER NOT NULL,
    "diasDesdeEntrega" INTEGER NOT NULL,
    "fechaProgramada" DATE NOT NULL,
    "estado" "EstadoSeguimientoAdopcion" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeguimientoAdopcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitaAdopcion_postulacionId_tipo_key" ON "VisitaAdopcion"("postulacionId", "tipo");

-- CreateIndex
CREATE INDEX "SeguimientoAdopcion_estado_fechaProgramada_idx" ON "SeguimientoAdopcion"("estado", "fechaProgramada");

-- CreateIndex
CREATE UNIQUE INDEX "SeguimientoAdopcion_postulacionId_diasDesdeEntrega_key" ON "SeguimientoAdopcion"("postulacionId", "diasDesdeEntrega");

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_omisionAutorizadaPorId_fkey" FOREIGN KEY ("omisionAutorizadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaAdopcion" ADD CONSTRAINT "VisitaAdopcion_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaAdopcion" ADD CONSTRAINT "VisitaAdopcion_registradaPorId_fkey" FOREIGN KEY ("registradaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoAdopcion" ADD CONSTRAINT "SeguimientoAdopcion_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
