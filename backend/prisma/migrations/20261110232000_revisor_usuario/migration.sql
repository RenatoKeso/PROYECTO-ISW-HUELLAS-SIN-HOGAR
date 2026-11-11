-- El revisor de una postulacion de adopcion pasa de Voluntario a Usuario.

-- DropForeignKey
ALTER TABLE "Postulacion" DROP CONSTRAINT "Postulacion_revisorId_fkey";

-- Los revisorId guardados son ids de Voluntario. Se traducen al Usuario que
-- tiene esa ficha de voluntario; si el voluntario no tiene cuenta, queda vacio.
UPDATE "Postulacion" AS p
SET "revisorId" = (
  SELECT u."id" FROM "Usuario" AS u WHERE u."voluntarioId" = p."revisorId"
)
WHERE p."revisorId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
