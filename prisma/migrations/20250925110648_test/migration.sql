/*
  Warnings:

  - You are about to drop the column `age_flag` on the `PatientCase` table. All the data in the column will be lost.
  - You are about to drop the column `treatment_duration_minutes` on the `PatientCase` table. All the data in the column will be lost.
  - You are about to drop the `Beds` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `age` to the `PatientCase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Beds" DROP CONSTRAINT "Beds_case_id_fkey";

-- AlterTable
ALTER TABLE "public"."PatientCase" DROP COLUMN "age_flag",
DROP COLUMN "treatment_duration_minutes",
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "treatment_duration" INTEGER;

-- DropTable
DROP TABLE "public"."Beds";
