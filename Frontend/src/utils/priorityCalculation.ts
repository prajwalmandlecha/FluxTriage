
import { Patient } from "../types/patient";

export function calculateNEWS2Score(vitals: Patient["vitals"]): number {
  let score = 0;

  // Respiratory Rate (breaths per minute)
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
    score += 3;
  } else if (vitals.oxygenSat >= 85 && vitals.oxygenSat <= 89) {
    score += 2;
  } else if (vitals.oxygenSat >= 90 && vitals.oxygenSat <= 93) {
    score += 1;
  }
  // >= 94 = 0 points

  // Supplemental O2
  if (vitals.oxygenSupport) {
    score += 2;
  }

  // Systolic BP
  if (vitals.systolicBP <= 90 || vitals.systolicBP >= 220) {
    score += 3;
  } else if (
    (vitals.systolicBP >= 91 && vitals.systolicBP <= 100) ||
    (vitals.systolicBP >= 201 && vitals.systolicBP <= 219)
  ) {
    score += 2;
  } else if (
    (vitals.systolicBP >= 101 && vitals.systolicBP <= 110) ||
    (vitals.systolicBP >= 181 && vitals.systolicBP <= 200)
  ) {
    score += 1;
  }
  // 111-180 = 0 points

  // Pulse (heart rate, beats per minute)
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
  const c = vitals.consciousness;
  if (c === "P" || c === "U" || c === "V" || c === "C") {
    score += 3;
  }
  // A (Alert) = 0 points

  // Cap score between 0 and 20 for consistency with backend
  return Math.min(20, Math.max(0, score | 0));
}
