/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Disease` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Disease` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Beds" ADD COLUMN     "assigned_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Disease" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PatientCase" ADD COLUMN     "treatment_duration_minutes" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Disease_code_key" ON "public"."Disease"("code");

-- CreateIndex
CREATE INDEX "PatientCase_zone_status_idx" ON "public"."PatientCase"("zone", "status");

-- AddForeignKey
ALTER TABLE "public"."PatientCase" ADD CONSTRAINT "PatientCase_disease_code_fkey" FOREIGN KEY ("disease_code") REFERENCES "public"."Disease"("code") ON DELETE SET NULL ON UPDATE CASCADE;
