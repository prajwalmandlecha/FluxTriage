/*
  Warnings:

  - Made the column `patient_id` on table `PatientCase` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."PatientCase" DROP CONSTRAINT "PatientCase_patient_id_fkey";

-- AlterTable
ALTER TABLE "public"."Patient" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."PatientCase" ALTER COLUMN "patient_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."PatientCase" ADD CONSTRAINT "PatientCase_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
