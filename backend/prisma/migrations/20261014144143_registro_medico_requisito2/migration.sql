-- CreateEnum
CREATE TYPE "EstadoValidacionMedica" AS ENUM ('PROVISIONAL', 'VALIDACION_PENDIENTE', 'REVISANDO', 'ACTUALIZADO', 'REALIZADO');

-- CreateEnum
CREATE TYPE "ClasificacionSalud" AS ENUM ('NORMAL', 'ENFERMO', 'CRITICO');

-- CreateEnum
CREATE TYPE "EstadoRevisionInicial" AS ENUM ('PENDIENTE', 'COMPLETADA', 'ACTUALIZADA', 'BLOQUEADA');

-- CreateEnum
CREATE TYPE "EstadoEnfermedad" AS ENUM ('EN_CURSO', 'RESUELTO', 'CRONICO');

-- CreateEnum
CREATE TYPE "EstadoTratamiento" AS ENUM ('EN_CURSO', 'RESUELTO', 'CRONICO');

-- CreateEnum
CREATE TYPE "EstadoAdopcion" AS ENUM ('ADOPTABLE', 'NO_ADOPTABLE');

-- AlterTable
ALTER TABLE "AtencionSanitaria" ADD COLUMN     "registroMedicoId" INTEGER;

-- AlterTable
ALTER TABLE "FichaAnimal" ADD COLUMN     "estadoAdopcion" "EstadoAdopcion";

-- CreateTable
CREATE TABLE "RegistroMedicoAnimal" (
    "id" SERIAL NOT NULL,
    "animalId" INTEGER NOT NULL,
    "ingresoAnimalId" INTEGER,
    "estadoValidacion" "EstadoValidacionMedica" NOT NULL DEFAULT 'PROVISIONAL',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroMedicoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionInicial" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "peso" DECIMAL(5,2),
    "clasificacionSalud" "ClasificacionSalud",
    "prioridadAtencion" INTEGER,
    "cuarentena" BOOLEAN,
    "observacionEstadoSalud" TEXT,
    "estadoRevisionInicial" "EstadoRevisionInicial" NOT NULL DEFAULT 'PENDIENTE',
    "fechaActualizacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "RevisionInicial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionCompleta" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "edad" INTEGER,
    "peso" DECIMAL(5,2),
    "descripcionCuidadosEspeciales" TEXT,
    "descripcionCondicionMedica" TEXT,
    "estadoSalud" "ClasificacionSalud",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "RevisionCompleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TratamientoAnimal" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "descripcionTratamiento" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "TratamientoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnfermedadAnimal" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "descripcionEnfermedad" TEXT NOT NULL,
    "tipoEnfermedad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "EnfermedadAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtencionVeterinaria" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "lugarAtencion" TEXT,
    "nombreClinicaExterna" TEXT,
    "nombreMedico" TEXT,
    "fechaAtencion" TIMESTAMP(3) NOT NULL,
    "descripcionAtencion" TEXT,
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "AtencionVeterinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoMedicoAnimal" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL,
    "peso" DECIMAL(5,2),
    "observacionSeguimiento" TEXT NOT NULL,
    "estadoSalud" "ClasificacionSalud" NOT NULL,
    "necesidades" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "SeguimientoMedicoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoEnfermedadAnimal" (
    "id" SERIAL NOT NULL,
    "seguimientoMedicoId" INTEGER NOT NULL,
    "enfermedadId" INTEGER NOT NULL,
    "estadoEnfermedad" "EstadoEnfermedad" NOT NULL,
    "observacionSeguimiento" TEXT,

    CONSTRAINT "SeguimientoEnfermedadAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguimientoTratamientoAnimal" (
    "id" SERIAL NOT NULL,
    "seguimientoMedicoId" INTEGER NOT NULL,
    "tratamientoId" INTEGER NOT NULL,
    "estadoTratamiento" "EstadoTratamiento" NOT NULL,
    "observacionSeguimiento" TEXT,

    CONSTRAINT "SeguimientoTratamientoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActualizacionEstadoAnimal" (
    "id" SERIAL NOT NULL,
    "animalId" INTEGER NOT NULL,
    "estadoAnterior" "EstadoAdopcion",
    "estadoNuevo" "EstadoAdopcion" NOT NULL,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" INTEGER NOT NULL,

    CONSTRAINT "ActualizacionEstadoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaRevisionInicial" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "hora" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" INTEGER NOT NULL,

    CONSTRAINT "AuditoriaRevisionInicial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialRegistroMedico" (
    "id" SERIAL NOT NULL,
    "registroMedicoId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "estadoOrigen" "EstadoValidacionMedica" NOT NULL,
    "peso" DECIMAL(5,2),
    "clasificacionSalud" "ClasificacionSalud",
    "descripcionCuidadosEspeciales" TEXT,
    "descripcionCondicionMedica" TEXT,
    "descripcionTratamientos" TEXT,
    "descripcionEnfermedades" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoPorId" INTEGER NOT NULL,

    CONSTRAINT "HistorialRegistroMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "destinatarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "registroMedicoId" INTEGER,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistroMedicoAnimal_animalId_key" ON "RegistroMedicoAnimal"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroMedicoAnimal_ingresoAnimalId_key" ON "RegistroMedicoAnimal"("ingresoAnimalId");

-- CreateIndex
CREATE INDEX "RegistroMedicoAnimal_estadoValidacion_idx" ON "RegistroMedicoAnimal"("estadoValidacion");

-- CreateIndex
CREATE UNIQUE INDEX "RevisionInicial_registroMedicoId_key" ON "RevisionInicial"("registroMedicoId");

-- CreateIndex
CREATE INDEX "RevisionInicial_estadoRevisionInicial_idx" ON "RevisionInicial"("estadoRevisionInicial");

-- CreateIndex
CREATE UNIQUE INDEX "RevisionCompleta_registroMedicoId_key" ON "RevisionCompleta"("registroMedicoId");

-- CreateIndex
CREATE INDEX "TratamientoAnimal_registroMedicoId_idx" ON "TratamientoAnimal"("registroMedicoId");

-- CreateIndex
CREATE INDEX "EnfermedadAnimal_registroMedicoId_idx" ON "EnfermedadAnimal"("registroMedicoId");

-- CreateIndex
CREATE INDEX "AtencionVeterinaria_registroMedicoId_idx" ON "AtencionVeterinaria"("registroMedicoId");

-- CreateIndex
CREATE INDEX "SeguimientoMedicoAnimal_registroMedicoId_fechaRegistro_idx" ON "SeguimientoMedicoAnimal"("registroMedicoId", "fechaRegistro");

-- CreateIndex
CREATE INDEX "SeguimientoEnfermedadAnimal_seguimientoMedicoId_idx" ON "SeguimientoEnfermedadAnimal"("seguimientoMedicoId");

-- CreateIndex
CREATE INDEX "SeguimientoEnfermedadAnimal_enfermedadId_idx" ON "SeguimientoEnfermedadAnimal"("enfermedadId");

-- CreateIndex
CREATE INDEX "SeguimientoTratamientoAnimal_seguimientoMedicoId_idx" ON "SeguimientoTratamientoAnimal"("seguimientoMedicoId");

-- CreateIndex
CREATE INDEX "SeguimientoTratamientoAnimal_tratamientoId_idx" ON "SeguimientoTratamientoAnimal"("tratamientoId");

-- CreateIndex
CREATE INDEX "ActualizacionEstadoAnimal_animalId_fechaActualizacion_idx" ON "ActualizacionEstadoAnimal"("animalId", "fechaActualizacion");

-- CreateIndex
CREATE INDEX "AuditoriaRevisionInicial_registroMedicoId_idx" ON "AuditoriaRevisionInicial"("registroMedicoId");

-- CreateIndex
CREATE INDEX "HistorialRegistroMedico_registroMedicoId_version_idx" ON "HistorialRegistroMedico"("registroMedicoId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "HistorialRegistroMedico_registroMedicoId_version_key" ON "HistorialRegistroMedico"("registroMedicoId", "version");

-- CreateIndex
CREATE INDEX "Notificacion_destinatarioId_leida_idx" ON "Notificacion"("destinatarioId", "leida");

-- CreateIndex
CREATE INDEX "AtencionSanitaria_registroMedicoId_idx" ON "AtencionSanitaria"("registroMedicoId");

-- AddForeignKey
ALTER TABLE "AtencionSanitaria" ADD CONSTRAINT "AtencionSanitaria_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroMedicoAnimal" ADD CONSTRAINT "RegistroMedicoAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "FichaAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroMedicoAnimal" ADD CONSTRAINT "RegistroMedicoAnimal_ingresoAnimalId_fkey" FOREIGN KEY ("ingresoAnimalId") REFERENCES "IngresoAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionInicial" ADD CONSTRAINT "RevisionInicial_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionInicial" ADD CONSTRAINT "RevisionInicial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionInicial" ADD CONSTRAINT "RevisionInicial_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionCompleta" ADD CONSTRAINT "RevisionCompleta_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionCompleta" ADD CONSTRAINT "RevisionCompleta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionCompleta" ADD CONSTRAINT "RevisionCompleta_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TratamientoAnimal" ADD CONSTRAINT "TratamientoAnimal_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TratamientoAnimal" ADD CONSTRAINT "TratamientoAnimal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnfermedadAnimal" ADD CONSTRAINT "EnfermedadAnimal_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnfermedadAnimal" ADD CONSTRAINT "EnfermedadAnimal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtencionVeterinaria" ADD CONSTRAINT "AtencionVeterinaria_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtencionVeterinaria" ADD CONSTRAINT "AtencionVeterinaria_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoMedicoAnimal" ADD CONSTRAINT "SeguimientoMedicoAnimal_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoMedicoAnimal" ADD CONSTRAINT "SeguimientoMedicoAnimal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoEnfermedadAnimal" ADD CONSTRAINT "SeguimientoEnfermedadAnimal_seguimientoMedicoId_fkey" FOREIGN KEY ("seguimientoMedicoId") REFERENCES "SeguimientoMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoEnfermedadAnimal" ADD CONSTRAINT "SeguimientoEnfermedadAnimal_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "EnfermedadAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoTratamientoAnimal" ADD CONSTRAINT "SeguimientoTratamientoAnimal_seguimientoMedicoId_fkey" FOREIGN KEY ("seguimientoMedicoId") REFERENCES "SeguimientoMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguimientoTratamientoAnimal" ADD CONSTRAINT "SeguimientoTratamientoAnimal_tratamientoId_fkey" FOREIGN KEY ("tratamientoId") REFERENCES "TratamientoAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualizacionEstadoAnimal" ADD CONSTRAINT "ActualizacionEstadoAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "FichaAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualizacionEstadoAnimal" ADD CONSTRAINT "ActualizacionEstadoAnimal_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaRevisionInicial" ADD CONSTRAINT "AuditoriaRevisionInicial_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaRevisionInicial" ADD CONSTRAINT "AuditoriaRevisionInicial_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialRegistroMedico" ADD CONSTRAINT "HistorialRegistroMedico_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialRegistroMedico" ADD CONSTRAINT "HistorialRegistroMedico_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_registroMedicoId_fkey" FOREIGN KEY ("registroMedicoId") REFERENCES "RegistroMedicoAnimal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
