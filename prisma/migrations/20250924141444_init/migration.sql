-- CreateEnum
CREATE TYPE "public"."CaseStatus" AS ENUM ('WAITING', 'IN_TREATMENT', 'DISCHARGED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."Action" AS ENUM ('ASSIGN_BED', 'RELEASE_BED', 'EXTEND_BED', 'OVERRIDE_PRIORITY');

-- CreateEnum
CREATE TYPE "public"."Zone" AS ENUM ('RED', 'ORANGE', 'YELLOW', 'GREEN');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "medical_history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientCase" (
    "id" TEXT NOT NULL,
    "zone" "public"."Zone" NOT NULL,
    "si" INTEGER NOT NULL,
    "news2" INTEGER NOT NULL,
    "resource_score" DOUBLE PRECISION NOT NULL,
    "age_flag" BOOLEAN NOT NULL DEFAULT false,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "last_eval_time" TIMESTAMP(3) NOT NULL,
    "time_served" TIMESTAMP(3),
    "priority" DOUBLE PRECISION NOT NULL,
    "disease_code" TEXT,
    "status" "public"."CaseStatus" NOT NULL DEFAULT 'WAITING',
    "patient_id" TEXT,

    CONSTRAINT "PatientCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Disease" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "treatment_time" INTEGER NOT NULL,
    "max_wait_time" INTEGER NOT NULL,
    "severity" INTEGER NOT NULL,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Beds" (
    "id" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "zone" "public"."Zone" NOT NULL,
    "case_id" TEXT,

    CONSTRAINT "Beds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phone_key" ON "public"."Patient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "public"."Patient"("email");

-- CreateIndex
CREATE INDEX "PatientCase_patient_id_idx" ON "public"."PatientCase"("patient_id");

-- CreateIndex
CREATE INDEX "PatientCase_time_served_idx" ON "public"."PatientCase"("time_served");

-- CreateIndex
CREATE UNIQUE INDEX "Beds_bed_number_key" ON "public"."Beds"("bed_number");

-- CreateIndex
CREATE UNIQUE INDEX "Beds_case_id_key" ON "public"."Beds"("case_id");

-- AddForeignKey
ALTER TABLE "public"."PatientCase" ADD CONSTRAINT "PatientCase_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Beds" ADD CONSTRAINT "Beds_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."PatientCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
