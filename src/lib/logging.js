import prisma from "./prisma.js";

export async function createCaseLog({
  caseId,
  patientId,
  zone,
  age,
  ageFactor,
  arrivalTime,
  diseaseCode,
}) {
  return prisma.caseLog.create({
    data: {
      case_id: caseId,
      patient_id: patientId,
      zone,
      age,
      age_factor: ageFactor,
      arrival_time: arrivalTime,
      disease_code: diseaseCode || null,
    },
  });
}

export async function appendCaseUpdate({
  caseLogId,
  vitals,
  news2,
  si,
  resourceScore,
  priority,
  waitingMinutes,
  rankInQueue,
  status,
}) {
  // Fetch context for derived fields required by the logging spec
  const caseLog = await prisma.caseLog.findUnique({ where: { id: caseLogId } });

  let maxWaitTime = null;
  let diseaseCode = caseLog?.disease_code ?? null;
  if (diseaseCode) {
    try {
      const disease = await prisma.disease.findUnique({
        where: { code: diseaseCode },
      });
      if (disease) maxWaitTime = disease.max_wait_time;
    } catch (_) {}
  }

  const now = new Date();
  const arrivalTime = caseLog?.arrival_time
    ? new Date(caseLog.arrival_time)
    : null;

  let totalTimeInSystem = null;
  if (typeof caseLog?.total_time_in_ed === "number") {
    totalTimeInSystem = caseLog.total_time_in_ed;
  } else if (arrivalTime) {
    totalTimeInSystem = Math.floor(
      (now.getTime() - arrivalTime.getTime()) / 60000
    );
  }

  let treatmentTime = null;
  if (caseLog?.treatment_start_time && arrivalTime) {
    const start = new Date(caseLog.treatment_start_time);
    treatmentTime = Math.max(
      0,
      Math.floor((start.getTime() - arrivalTime.getTime()) / 60000)
    );
  }

  // Escalation when current wait exceeds max wait
  let escalation = false;
  if (maxWaitTime != null && typeof waitingMinutes === "number") {
    escalation = waitingMinutes > maxWaitTime;
  }

  // Persist escalation flag at the case level when first detected
  if (escalation && caseLog && !caseLog.escalation) {
    try {
      await prisma.caseLog.update({
        where: { id: caseLog.id },
        data: { escalation: true },
      });
    } catch (_) {}
  }

  // Map gender to sex for logging (M/F/O)
  let sex = null;
  if (caseLog?.patient_id) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: caseLog.patient_id },
      });
      if (patient?.gender === "MALE") sex = "M";
      else if (patient?.gender === "FEMALE") sex = "F";
      else if (patient?.gender) sex = "O";
    } catch (_) {}
  }

  // Build spec-aligned vitals payload (while retaining raw vitals)
  const normalizedVitals = vitals && typeof vitals === "object" ? vitals : {};
  const specVitals = {
    NEWS2: news2,
    SI: si,
    heart_rate: normalizedVitals.heart_rate ?? null,
    bp_systolic: normalizedVitals.systolic_bp ?? null,
    bp_diastolic: normalizedVitals.diastolic_bp ?? null,
    spo2: normalizedVitals.oxygen_saturation ?? null,
    temperature: normalizedVitals.temperature ?? null,
  };

  const vitalsJson = {
    ...specVitals,
    raw: normalizedVitals,
    resource_score: resourceScore,
    max_wait_time: maxWaitTime ?? null,
    current_wait_time: waitingMinutes,
    total_time_in_system: totalTimeInSystem,
    escalation,
    treatment_time: treatmentTime,
    zone: caseLog?.zone ?? null,
    disease_code: diseaseCode,
    age: caseLog?.age ?? null,
    sex,
  };

  return prisma.caseUpdate.create({
    data: {
      case_log_id: caseLogId,
      vitals_json: vitalsJson,
      news2,
      si,
      resourceScore,
      priority,
      waiting_time: waitingMinutes,
      rank_in_queue: rankInQueue ?? null,
      status,
    },
  });
}

export async function markTreatmentTimes({ caseId, startTime, endTime }) {
  return prisma.caseLog.updateMany({
    where: { case_id: caseId },
    data: {
      treatment_start_time: startTime ?? undefined,
      treatment_end_time: endTime ?? undefined,
    },
  });
}

export async function setOutcomeAndTotals({
  caseId,
  outcome,
  totalTimeInMinutes,
}) {
  return prisma.caseLog.updateMany({
    where: { case_id: caseId },
    data: {
      outcome: outcome ?? undefined,
      total_time_in_ed: totalTimeInMinutes ?? undefined,
    },
  });
}

export async function getCaseLogs(caseId) {
  return prisma.caseLog.findFirst({
    where: { case_id: caseId },
    include: { updates: { orderBy: { timestamp: "asc" } } },
  });
}

export async function ensureCaseLogForCase({
  caseId,
  patientId,
  zone,
  age,
  ageFactor,
  arrivalTime,
  diseaseCode,
}) {
  const existing = await prisma.caseLog.findFirst({
    where: { case_id: caseId },
  });
  if (existing) return existing;
  return createCaseLog({
    caseId,
    patientId,
    zone,
    age,
    ageFactor,
    arrivalTime,
    diseaseCode,
  });
}
