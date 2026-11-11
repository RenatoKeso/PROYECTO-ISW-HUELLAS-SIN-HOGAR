/*
  Warnings:

  - You are about to drop the column `rut` on the `PostulacionVoluntario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PostulacionVoluntario_rut_idx";

-- AlterTable
ALTER TABLE "PostulacionVoluntario" DROP COLUMN "rut";
