-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('WAITING', 'IN_TREATMENT', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('RED', 'ORANGE', 'YELLOW', 'GREEN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientCase" (
    "id" TEXT NOT NULL,
    "zone" "Zone" NOT NULL,
    "si" INTEGER NOT NULL,
    "news2" INTEGER NOT NULL,
    "resource_score" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "vitals" JSONB,
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "priority" DOUBLE PRECISION NOT NULL,
    "treatment_duration" INTEGER,
    "max_wait_time" INTEGER,
    "status" "CaseStatus" NOT NULL DEFAULT 'WAITING',
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "last_eval_time" TIMESTAMP(3) NOT NULL,
    "time_served" TIMESTAMP(3),
    "disease_code" TEXT,
    "patient_id" TEXT NOT NULL,

    CONSTRAINT "PatientCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "treatment_time" INTEGER NOT NULL,
    "max_wait_time" INTEGER NOT NULL,
    "severity" INTEGER NOT NULL,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseLog" (
    "log_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zone" "Zone" NOT NULL,
    "disease_code" TEXT,
    "priority" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "Gender" NOT NULL,
    "SI" DOUBLE PRECISION NOT NULL,
    "NEWS2" INTEGER NOT NULL,
    "respiratory_rate" INTEGER NOT NULL,
    "spo2" INTEGER NOT NULL,
    "o2_device" TEXT NOT NULL,
    "bp_systolic" INTEGER NOT NULL,
    "pulse_rate" INTEGER NOT NULL,
    "consciousness" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "resource_score" DOUBLE PRECISION NOT NULL,
    "max_wait_time" INTEGER,
    "current_wait_time" INTEGER NOT NULL,
    "total_time_in_system" INTEGER NOT NULL,
    "escalation" BOOLEAN NOT NULL DEFAULT false,
    "treatment_time" INTEGER,
    "status" TEXT NOT NULL,

    CONSTRAINT "CaseLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Patient_name_idx" ON "Patient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_name_dateOfBirth_key" ON "Patient"("name", "dateOfBirth");

-- CreateIndex
CREATE INDEX "PatientCase_zone_status_idx" ON "PatientCase"("zone", "status");

-- CreateIndex
CREATE INDEX "PatientCase_patient_id_idx" ON "PatientCase"("patient_id");

-- CreateIndex
CREATE INDEX "PatientCase_time_served_idx" ON "PatientCase"("time_served");

-- CreateIndex
CREATE INDEX "PatientCase_priority_idx" ON "PatientCase"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "Disease_code_key" ON "Disease"("code");

-- CreateIndex
CREATE INDEX "CaseLog_case_id_idx" ON "CaseLog"("case_id");

-- CreateIndex
CREATE INDEX "CaseLog_patient_id_idx" ON "CaseLog"("patient_id");

-- CreateIndex
CREATE INDEX "CaseLog_timestamp_idx" ON "CaseLog"("timestamp");

-- AddForeignKey
ALTER TABLE "PatientCase" ADD CONSTRAINT "PatientCase_disease_code_fkey" FOREIGN KEY ("disease_code") REFERENCES "Disease"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCase" ADD CONSTRAINT "PatientCase_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLog" ADD CONSTRAINT "CaseLog_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLog" ADD CONSTRAINT "CaseLog_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "PatientCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
