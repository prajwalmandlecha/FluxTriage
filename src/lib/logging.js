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
  return prisma.caseUpdate.create({
    data: {
      case_log_id: caseLogId,
      vitals_json: vitals,
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
