-- CreateEnum
CREATE TYPE "EstadoPostulacionVoluntario" AS ENUM ('EN_REVISION', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "HabilidadVoluntario" AS ENUM ('CUIDADO_ANIMALES', 'LIMPIEZA', 'TRANSPORTE', 'APOYO_VETERINARIO', 'DIFUSION_REDES', 'EVENTOS', 'OTRA');

-- CreateTable
CREATE TABLE "PostulacionVoluntario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "diasDisponibles" "DiaSemana"[],
    "motivacion" TEXT NOT NULL,
    "habilidades" "HabilidadVoluntario"[],
    "otraHabilidad" TEXT,
    "estado" "EstadoPostulacionVoluntario" NOT NULL DEFAULT 'EN_REVISION',
    "motivoRechazo" TEXT,
    "fechaRevision" TIMESTAMP(3),
    "revisadaPorId" INTEGER,
    "voluntarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostulacionVoluntario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostulacionVoluntario_voluntarioId_key" ON "PostulacionVoluntario"("voluntarioId");

-- CreateIndex
CREATE INDEX "PostulacionVoluntario_estado_idx" ON "PostulacionVoluntario"("estado");

-- CreateIndex
CREATE INDEX "PostulacionVoluntario_rut_idx" ON "PostulacionVoluntario"("rut");

-- CreateIndex
CREATE INDEX "PostulacionVoluntario_email_idx" ON "PostulacionVoluntario"("email");

-- AddForeignKey
ALTER TABLE "PostulacionVoluntario" ADD CONSTRAINT "PostulacionVoluntario_revisadaPorId_fkey" FOREIGN KEY ("revisadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostulacionVoluntario" ADD CONSTRAINT "PostulacionVoluntario_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "Voluntario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
