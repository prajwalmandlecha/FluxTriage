/**
 * Zone-specific weights for priority score calculation
 * 
 * Each zone has different weighting factors for:
 * - wNEWS2: Weight for NEWS2 score (vital signs severity)
 * - wSI: Weight for Severity Index (disease severity)
 * - wT: Weight for waiting Time (how long patient has been waiting)
 * - wR: Weight for Resource score (expected resource consumption)
 * - wA: Weight for Age factor (age-related risk)
 * 
 * These weights have been optimized through external analysis of patient flow data.
 * Note: Wait time (wT) becomes increasingly important for lower acuity zones,
 * ensuring that stable patients aren't neglected during busy periods.
 */
export const priorityWeights = {
  RED: {
    wNEWS2: 0.01,
    wSI: 0.0947,
    wT: 0.8321,
    wR: 0.01,
    wA: 0.2222
  },
  ORANGE: {
    wNEWS2: 0.01,
    wSI: 0.4324,
    wT: 0.8815,
    wR: 0.01,
    wA: 0.4611
  },
  YELLOW: {
    wNEWS2: 0.01,
    wSI: 0.01,
    wT: 0.7226,
    wR: 0.01,
    wA: 0.01
  },
  GREEN: {
    wNEWS2: 0.0968,
    wSI: 0.2717,
    wT: 1.0,
    wR: 0.01,
    wA: 0.0133
  }
};

/**
 * Calculate age factor for priority weighting
 * 
 * Patients outside the 18-50 age range are considered higher risk:
 * - Children (<18): Different physiology, deteriorate faster
 * - Elderly (>50): More comorbidities, higher mortality risk
 * 
 * @param {number} age - Patient age in years
 * @returns {number} 0 for low-risk age, 1 for high-risk age
 */
export function calculateAgeFactor(age) {
  return (age >= 18 && age <= 50) ? 0 : 1;
}

/**
 * Calculate priority score using zone-specific weights
 * 
 * Combines multiple clinical and demographic factors into a single priority score.
 * Higher scores indicate more urgent cases that should be treated sooner.
 * 
 * The weights are optimized to balance clinical urgency with fair queue management:
 * - Critical zones (RED/ORANGE): Prioritize severity and age, but wait time still matters
 * - Stable zones (YELLOW/GREEN): Wait time is the primary factor to prevent neglect
 * 
 * @param {string} zone - Triage zone (RED/ORANGE/YELLOW/GREEN)
 * @param {number} news2 - NEWS2 score (0-20)
 * @param {number} si - Severity Index (1-4)
 * @param {number} waitingMinutes - Minutes patient has been waiting
 * @param {number} resourceScore - Expected resource consumption (1.0-5.0)
 * @param {number} age - Patient age in years
 * @returns {number} Priority score (higher = more urgent)
 */
export function calculatePriorityScore(zone, news2, si, waitingMinutes, resourceScore, age) {
  const ageFactor = calculateAgeFactor(age);
  const weights = priorityWeights[zone];
  
  if (!weights) {
    throw new Error(`Invalid zone: ${zone}`);
  }
  
  return (
    weights.wNEWS2 * news2 +
    weights.wSI * si +
    weights.wT * waitingMinutes +
    weights.wR * resourceScore +
    weights.wA * ageFactor
  );
}

/**
 * Determine triage zone from NEWS2 score
 * 
 * NEWS2 (National Early Warning Score 2) assesses vital signs:
 * - 0-1: Low risk (GREEN)
 * - 2-4: Medium risk (YELLOW)
 * - 5-8: High risk (ORANGE)
 * - 9+: Critical risk (RED)
 * 
 * @param {number} news2Score - Calculated NEWS2 score (0-20)
 * @returns {string} Zone assignment (RED/ORANGE/YELLOW/GREEN)
 */
export function determineZoneFromNEWS2(news2Score) {
  if (news2Score >= 9) return 'RED';
  if (news2Score >= 5) return 'ORANGE';
  if (news2Score >= 2) return 'YELLOW';
  return 'GREEN';
}

/**
 * Determine triage zone from Severity Index
 * 
 * SI represents disease-specific severity classification:
 * - 4: Life-threatening (RED)
 * - 3: Severe (ORANGE)
 * - 2: Moderate (YELLOW)
 * - 1: Minor (GREEN)
 * 
 * @param {number} si - Severity Index (1-4)
 * @returns {string} Zone assignment (RED/ORANGE/YELLOW/GREEN)
 */
export function determineZoneFromSI(si) {
  if (si === 4) return 'RED';
  if (si === 3) return 'ORANGE';
  if (si === 2) return 'YELLOW';
  return 'GREEN';
}

/**
 * Assign final triage zone based on both NEWS2 and SI
 * 
 * Uses the "worst case" principle: if either score indicates higher acuity,
 * that zone is selected. This ensures we don't underestimate patient risk.
 * 
 * Example: If NEWS2 → YELLOW but SI → RED, final zone is RED
 * 
 * @param {number} news2 - NEWS2 score (0-20)
 * @param {number} si - Severity Index (1-4)
 * @returns {string} Final zone assignment (RED/ORANGE/YELLOW/GREEN)
 */
export function assignZone(news2, si) {
  const news2Zone = determineZoneFromNEWS2(news2);
  const siZone = determineZoneFromSI(si);
  
  // Use the higher priority zone (RED > ORANGE > YELLOW > GREEN)
  const zonePriority = { RED: 4, ORANGE: 3, YELLOW: 2, GREEN: 1 };
  
  return zonePriority[news2Zone] >= zonePriority[siZone] ? news2Zone : siZone;
}
