-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('PERRO', 'GATO', 'OTRO');

-- CreateEnum
CREATE TYPE "SexoAnimal" AS ENUM ('MACHO', 'HEMBRA', 'DESCONOCIDO');

-- CreateEnum
CREATE TYPE "EstadoEstadiaAnimal" AS ENUM ('ACTIVO', 'ADOPTADO', 'ESPERA_ADOPCION', 'EGRESADO', 'FALLECIDO', 'TRANSFERIDO');

-- CreateTable
CREATE TABLE "FichaAnimal" (
    "id" SERIAL NOT NULL,
    "codigoAnimal" TEXT NOT NULL,
    "nombre" TEXT,
    "sexoAnimal" "SexoAnimal" NOT NULL,
    "especie" "Especie" NOT NULL,
    "raza" TEXT,
    "edad" INTEGER,
    "estadoEstadia" "EstadoEstadiaAnimal" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngresoAnimal" (
    "id" SERIAL NOT NULL,
    "fichaAnimalId" INTEGER NOT NULL,
    "receptorId" INTEGER NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "procedencia" TEXT NOT NULL,
    "ubicacionEncontrado" TEXT,
    "estadoSalud" TEXT,

    CONSTRAINT "IngresoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voluntario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voluntario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FichaAnimal_codigoAnimal_key" ON "FichaAnimal"("codigoAnimal");

-- CreateIndex
CREATE UNIQUE INDEX "Voluntario_email_key" ON "Voluntario"("email");

-- AddForeignKey
ALTER TABLE "IngresoAnimal" ADD CONSTRAINT "IngresoAnimal_fichaAnimalId_fkey" FOREIGN KEY ("fichaAnimalId") REFERENCES "FichaAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoAnimal" ADD CONSTRAINT "IngresoAnimal_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
