-- CreateTable
CREATE TABLE "public"."CaseLog" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "zone" "public"."Zone" NOT NULL,
    "age" INTEGER NOT NULL,
    "age_factor" INTEGER NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "disease_code" TEXT,
    "treatment_start_time" TIMESTAMP(3),
    "treatment_end_time" TIMESTAMP(3),
    "total_time_in_ed" INTEGER,
    "escalation" BOOLEAN DEFAULT false,
    "outcome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaseUpdate" (
    "id" TEXT NOT NULL,
    "case_log_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vitals_json" JSONB NOT NULL,
    "news2" INTEGER NOT NULL,
    "si" INTEGER NOT NULL,
    "resourceScore" DOUBLE PRECISION NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL,
    "waiting_time" INTEGER NOT NULL,
    "rank_in_queue" INTEGER,
    "status" "public"."CaseStatus" NOT NULL,

    CONSTRAINT "CaseUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseLog_case_id_idx" ON "public"."CaseLog"("case_id");

-- CreateIndex
CREATE INDEX "CaseLog_patient_id_idx" ON "public"."CaseLog"("patient_id");

-- CreateIndex
CREATE INDEX "CaseUpdate_case_log_id_idx" ON "public"."CaseUpdate"("case_log_id");

-- AddForeignKey
ALTER TABLE "public"."CaseLog" ADD CONSTRAINT "CaseLog_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."PatientCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CaseUpdate" ADD CONSTRAINT "CaseUpdate_case_log_id_fkey" FOREIGN KEY ("case_log_id") REFERENCES "public"."CaseLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
