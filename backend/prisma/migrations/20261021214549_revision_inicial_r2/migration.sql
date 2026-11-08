-- AlterTable
ALTER TABLE "RegistroMedicoAnimal" ADD COLUMN     "clasificacionSalud" "ClasificacionSalud",
ADD COLUMN     "fechaRevisionInicial" TIMESTAMP(3),
ADD COLUMN     "observacionInicial" TEXT,
ADD COLUMN     "pesoKg" DECIMAL(5,2),
ADD COLUMN     "requiereCuarentena" BOOLEAN,
ADD COLUMN     "revisionInicialPorId" INTEGER;

-- AddForeignKey
ALTER TABLE "RegistroMedicoAnimal" ADD CONSTRAINT "RegistroMedicoAnimal_revisionInicialPorId_fkey" FOREIGN KEY ("revisionInicialPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
