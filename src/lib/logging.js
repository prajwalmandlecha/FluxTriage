import prisma from "./prisma.js";

/**
 * Create a new CaseLog entry (time-series snapshot)
 * 
 * Creates a complete snapshot of the patient's state at a specific moment in time.
 * This function is called at key events:
 * - Patient arrival (initial triage)
 * - Every 2 minutes during priority recalculation
 * - When patient is sent to treatment queue
 * - When patient is discharged
 * 
 * Each call creates a NEW CaseLog record. Multiple logs can exist for the same case_id,
 * forming a time-series dataset for ML analysis of patient flow, priority evolution,
 * and wait time patterns.
 * 
 * @param {Object} params - Complete case log parameters
 * @param {string} params.patientId - Patient ID
 * @param {string} params.caseId - PatientCase ID
 * @param {string} params.zone - Current triage zone (RED/ORANGE/YELLOW/GREEN)
 * @param {string} [params.diseaseCode] - ICD-10 or other disease code (optional)
 * @param {number} params.priority - Calculated priority score
 * @param {number} params.age - Patient age in years
 * @param {string} params.sex - Patient sex (MALE/FEMALE/OTHER)
 * @param {number} params.SI - Severity Index (1-4)
 * @param {number} params.NEWS2 - NEWS2 score (0-20)
 * @param {number} params.respiratory_rate - Breaths per minute
 * @param {number} params.spo2 - Oxygen saturation percentage (0-100)
 * @param {string} params.o2_device - "Air" or "O2" (oxygen device)
 * @param {number} params.bp_systolic - Systolic blood pressure (mmHg)
 * @param {number} params.pulse_rate - Heart rate (bpm)
 * @param {string} params.consciousness - AVPU consciousness level (Alert/Voice/Pain/Unresponsive)
 * @param {number} params.temperature - Body temperature (°C)
 * @param {number} params.resource_score - Resource consumption estimate (1.0-5.0)
 * @param {number} [params.max_wait_time] - Maximum acceptable wait time (minutes)
 * @param {number} params.current_wait_time - Time waited so far (minutes)
 * @param {number} params.total_time_in_system - Total time from arrival to now (minutes)
 * @param {boolean} [params.escalation] - True if wait time exceeded max_wait_time
 * @param {number} [params.treatment_time] - Time from arrival to treatment start (minutes)
 * @param {string} params.status - Current status (Waiting/IN_TREATMENT/DISCHARGED)
 * @returns {Promise<Object>} Created CaseLog record
 */
export async function createCaseLog({
  patientId,
  caseId,
  zone,
  diseaseCode,
  priority,
  age,
  sex,
  SI,
  NEWS2,
  respiratory_rate,
  spo2,
  o2_device,
  bp_systolic,
  pulse_rate,
  consciousness,
  temperature,
  resource_score,
  max_wait_time,
  current_wait_time,
  total_time_in_system,
  escalation,
  treatment_time,
  status,
}) {
  return prisma.caseLog.create({
    data: {
      patient_id: patientId,
      case_id: caseId,
      zone,
      disease_code: diseaseCode ?? null,
      priority,
      age,
      sex,
      SI,
      NEWS2,
      respiratory_rate,
      spo2,
      o2_device,
      bp_systolic,
      pulse_rate,
      consciousness,
      temperature,
      resource_score,
      max_wait_time: max_wait_time ?? null,
      current_wait_time,
      total_time_in_system,
      escalation: escalation ?? false,
      treatment_time: treatment_time ?? null,
      status,
    },
  });
}

/**
 * Retrieve all logs for a specific case (time-series)
 * 
 * Returns all CaseLog records for a case ordered chronologically.
 * Useful for viewing complete patient journey and exporting data for ML analysis.
 * 
 * @param {string} caseId - PatientCase ID
 * @returns {Promise<Array>} Array of CaseLog records ordered by timestamp
 */
export async function getCaseLogs(caseId) {
  return prisma.caseLog.findMany({
    where: { case_id: caseId },
    orderBy: { timestamp: "asc" },
  });
}

/**
 * Get all logs within a time range (for batch ML export)
 * 
 * @param {Date} startDate - Start of time range
 * @param {Date} endDate - End of time range
 * @returns {Promise<Array>} Array of CaseLog records
 */
export async function getCaseLogsInRange(startDate, endDate) {
  return prisma.caseLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: "asc" },
  });
}

/**
 * Get all logs for a specific patient (across all cases)
 * 
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} Array of CaseLog records
 */
export async function getPatientLogs(patientId) {
  return prisma.caseLog.findMany({
    where: { patient_id: patientId },
    orderBy: { timestamp: "asc" },
  });
}
