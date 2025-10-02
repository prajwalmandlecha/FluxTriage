// Vitals mapping between frontend and backend formats
// Frontend uses: A, C, V, P, U (ACVPU scale)
// Backend uses: ALERT, VOICE, PAIN, UNRESPONSIVE

export function mapConsciousnessToBackend(consciousness) {
  const mapping = {
    'A': 'ALERT',
    'C': 'CONFUSED',   // Confused - scores 1 point in NEWS2
    'V': 'VOICE',      // Responds to voice
    'P': 'PAIN',       // Responds to pain
    'U': 'UNRESPONSIVE'
  };
  return mapping[consciousness] || 'ALERT';
}

export function mapConsciousnessToFrontend(consciousness) {
  const mapping = {
    'ALERT': 'A',
    'CONFUSED': 'C',
    'VOICE': 'V',
    'PAIN': 'P',
    'UNRESPONSIVE': 'U'
  };
  return mapping[consciousness] || 'A';
}

// Convert frontend vitals format to backend format
export function vitalsToBackend(frontendVitals) {
  return {
    respiratory_rate: frontendVitals.respiratoryRate,
    oxygen_saturation: frontendVitals.oxygenSat,
    supplemental_oxygen: frontendVitals.oxygenSupport,
    temperature: frontendVitals.temperature,
    systolic_bp: frontendVitals.systolicBP,
    heart_rate: frontendVitals.pulse,
    consciousness_level: mapConsciousnessToBackend(frontendVitals.consciousness)
  };
}

// Convert backend vitals format to frontend format
export function vitalsToFrontend(backendVitals) {
  return {
    respiratoryRate: backendVitals.respiratory_rate,
    oxygenSat: backendVitals.oxygen_saturation,
    oxygenSupport: backendVitals.supplemental_oxygen,
    temperature: backendVitals.temperature,
    systolicBP: backendVitals.systolic_bp,
    pulse: backendVitals.heart_rate,
    consciousness: mapConsciousnessToFrontend(backendVitals.consciousness_level)
  };
}
