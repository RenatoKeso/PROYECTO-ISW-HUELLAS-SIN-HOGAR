-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('PUBLICADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "AccionInscripcion" AS ENUM ('INSCRIPCION', 'MODIFICACION', 'CANCELACION');

-- CreateTable
CREATE TABLE "Turno" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "termino" TIMESTAMP(3) NOT NULL,
    "fechaLimiteInscripcion" TIMESTAMP(3) NOT NULL,
    "cupoMaximo" INTEGER NOT NULL,
    "cuposDisponibles" INTEGER NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'PUBLICADO',
    "publicadoPorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscripcionTurno" (
    "id" SERIAL NOT NULL,
    "turnoId" INTEGER NOT NULL,
    "voluntarioId" INTEGER NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVA',
    "canceladaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscripcionTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialInscripcion" (
    "id" SERIAL NOT NULL,
    "inscripcionId" INTEGER NOT NULL,
    "accion" "AccionInscripcion" NOT NULL,
    "turnoId" INTEGER NOT NULL,
    "turnoAnteriorId" INTEGER,
    "detalle" TEXT,
    "realizadoPorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialInscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Turno_estado_inicio_idx" ON "Turno"("estado", "inicio");

-- CreateIndex
CREATE INDEX "InscripcionTurno_voluntarioId_estado_idx" ON "InscripcionTurno"("voluntarioId", "estado");

-- CreateIndex
CREATE INDEX "InscripcionTurno_turnoId_estado_idx" ON "InscripcionTurno"("turnoId", "estado");

-- CreateIndex
CREATE INDEX "HistorialInscripcion_inscripcionId_fecha_idx" ON "HistorialInscripcion"("inscripcionId", "fecha");

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_publicadoPorId_fkey" FOREIGN KEY ("publicadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionTurno" ADD CONSTRAINT "InscripcionTurno_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionTurno" ADD CONSTRAINT "InscripcionTurno_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialInscripcion" ADD CONSTRAINT "HistorialInscripcion_inscripcionId_fkey" FOREIGN KEY ("inscripcionId") REFERENCES "InscripcionTurno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialInscripcion" ADD CONSTRAINT "HistorialInscripcion_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialInscripcion" ADD CONSTRAINT "HistorialInscripcion_turnoAnteriorId_fkey" FOREIGN KEY ("turnoAnteriorId") REFERENCES "Turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialInscripcion" ADD CONSTRAINT "HistorialInscripcion_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
