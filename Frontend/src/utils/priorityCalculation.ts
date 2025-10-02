import {
  Patient,
  PriorityWeights,
  ZonePriorityWeights,
} from "../types/patient";
import { priorityWeights } from "../data/diseaseDatabase";

export function calculateNEWS2Score(vitals: Patient["vitals"]): number {
  let score = 0;

  // Respiratory Rate (breaths per minute)
  // ≤8: +3 | 9-11: +1 | 12-20: 0 | 21-24: +2 | ≥25: +3
  if (vitals.respiratoryRate <= 8) {
    score += 3;
  } else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 11) {
    score += 1;
  } else if (vitals.respiratoryRate >= 21 && vitals.respiratoryRate <= 24) {
    score += 2;
  } else if (vitals.respiratoryRate >= 25) {
    score += 3;
  }
  // 12-20 = 0 points

  // SpO2
  if (vitals.oxygenSat < 85) {
    score += 3; // RED
  } else if (vitals.oxygenSat >= 85 && vitals.oxygenSat <= 89) {
    score += 2; // ORANGE
  } else if (vitals.oxygenSat >= 90 && vitals.oxygenSat <= 93) {
    score += 1; // YELLOW
  }
  // >= 94 = 0 points

  // Supplemental O2
  // Room air: 0 | Supplemental O2: +2
  if (vitals.oxygenSupport) {
    score += 2;
  }

  // Systolic BP
  if (vitals.systolicBP <= 90 || vitals.systolicBP >= 220) {
    score += 3; // RED
  } else if (
    (vitals.systolicBP >= 91 && vitals.systolicBP <= 100) ||
    (vitals.systolicBP >= 201 && vitals.systolicBP <= 219)
  ) {
    score += 2; // ORANGE
  } else if (
    (vitals.systolicBP >= 101 && vitals.systolicBP <= 110) ||
    (vitals.systolicBP >= 181 && vitals.systolicBP <= 200)
  ) {
    score += 1; // YELLOW
  }
  // 111-219 = 0 points

  // Pulse (heart rate, beats per minute)
  // ≤40: +3 | 41-50: +1 | 51-90: 0 | 91-110: +1 | 111-130: +2 | ≥131: +3
  if (vitals.pulse <= 40 || vitals.pulse >= 131) {
    score += 3;
  } else if (vitals.pulse >= 111 && vitals.pulse <= 130) {
    score += 2;
  } else if (
    (vitals.pulse >= 41 && vitals.pulse <= 50) ||
    (vitals.pulse >= 91 && vitals.pulse <= 110)
  ) {
    score += 1;
  }
  // 51-90 = 0 points

  // Temperature (in Celsius)
  // ≤35.0°C: +3 | 35.1-36.0°C: +1 | 36.1-38.0°C: 0 | 38.1-39.0°C: +1 | ≥39.1°C: +2
  if (vitals.temperature <= 35.0) {
    score += 3;
  } else if (vitals.temperature >= 39.1) {
    score += 2;
  } else if (vitals.temperature >= 35.1 && vitals.temperature <= 36.0) {
    score += 1;
  } else if (vitals.temperature >= 38.1 && vitals.temperature <= 39.0) {
    score += 1;
  }
  // 36.1-38.0°C = 0 points

  // Consciousness Level (ACVPU)
  // Alert: 0 | New confusion/agitation, Voice, Pain, Unresponsive: +3
  if (
    vitals.consciousness === "P" ||
    vitals.consciousness === "U" ||
    vitals.consciousness === "V" ||
    vitals.consciousness === "C"
  ) {
    score += 3;
  }
  // A (Alert) = 0 points

  return score;
}

/**
 * Determine triage zone from NEWS2 score
 *
 * Based on NHS NEWS2 clinical response thresholds:
 * - 0-1: Low risk (GREEN) - Routine monitoring
 * - 2-4: Low-Medium risk (YELLOW) - Regular monitoring (4-6 hourly)
 * - 5-6: Medium risk (ORANGE) - Increased monitoring (hourly)
 * - 7+: High/Critical risk (RED) - Urgent/emergency response
 */
export function determineZoneFromNEWS2(
  news2Score: number
): "Red" | "Orange" | "Yellow" | "Green" {
  if (news2Score >= 7) return "Red"; // Changed from >= 9
  if (news2Score >= 5) return "Orange";
  if (news2Score >= 2) return "Yellow";
  return "Green";
}

export function calculateAgeFactor(age: number): number {
  return age >= 18 && age <= 50 ? 0 : 1;
}

/**
 * Calculate priority score using zone-specific weights
 *
 * @param zone - Triage zone (Red/Orange/Yellow/Green)
 * @param news2Score - NEWS2 score (0-20)
 * @param severityIndex - Severity Index (1-4)
 * @param waitingTime - Minutes patient has been waiting
 * @param resourceScore - Expected resource consumption (1.0-5.0)
 * @param age - Patient age in years
 * @returns Priority score (higher = more urgent)
 */
export function calculatePriorityScore(
  zone: "Red" | "Orange" | "Yellow" | "Green",
  news2Score: number,
  severityIndex: number,
  waitingTime: number,
  resourceScore: number,
  age: number
): number {
  const ageFactor = calculateAgeFactor(age);
  const zoneKey = zone.toUpperCase() as keyof ZonePriorityWeights;
  const weights = priorityWeights[zoneKey];

  if (!weights) {
    throw new Error(`Invalid zone: ${zone}`);
  }

  return (
    weights.wNEWS2 * news2Score +
    weights.wSI * severityIndex +
    weights.wT * waitingTime +
    weights.wR * resourceScore +
    weights.wA * ageFactor
  );
}

export function updatePatientPriority(patient: Patient): Patient {
  const news2Score = calculateNEWS2Score(patient.vitals);

  // Determine zone based on both NEWS2 and SI
  const news2Zone = determineZoneFromNEWS2(news2Score);
  const siZone =
    patient.severityIndex === 4
      ? "Red"
      : patient.severityIndex === 3
      ? "Orange"
      : patient.severityIndex === 2
      ? "Yellow"
      : "Green";

  // Use the higher priority zone (Red > Orange > Yellow > Green)
  const zonePriority = { Red: 4, Orange: 3, Yellow: 2, Green: 1 };
  const finalZone =
    zonePriority[news2Zone] >= zonePriority[siZone] ? news2Zone : siZone;

  // Calculate priority score using zone-specific weights
  const priorityScore = calculatePriorityScore(
    finalZone,
    news2Score,
    patient.severityIndex,
    patient.waitingTime,
    patient.resourceScore,
    patient.age
  );

  return {
    ...patient,
    news2Score,
    priorityScore,
    priority: finalZone,
  };
}
