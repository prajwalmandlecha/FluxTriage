// NEWS2 calculation based on standard scoring rules
// Inputs expected:
// {
//   respiratory_rate: number,            // breaths/min
//   oxygen_saturation: number,           // % SpO2
//   supplemental_oxygen: boolean,        // true if receiving O2
//   temperature: number,                 // °C
//   systolic_bp: number,                 // mmHg
//   heart_rate: number,                  // bpm
//   consciousness_level: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE'
// }

export function calculateNEWS2(vitals) {
  if (!vitals || typeof vitals !== "object") return 0;

  const {
    respiratory_rate = 0,
    oxygen_saturation = 0,
    supplemental_oxygen = false,
    temperature = 0,
    systolic_bp = 0,
    heart_rate = 0,
    consciousness_level = "ALERT",
  } = vitals;

  let score = 0;

  // Respiratory rate
  if (respiratory_rate <= 8) score += 3;
  else if (respiratory_rate <= 11) score += 1;
  else if (respiratory_rate <= 20) score += 0;
  else if (respiratory_rate <= 24) score += 2;
  else score += 3;

  // Oxygen saturation (SpO2) with O2 supplement adds +2 and uses scale 1
  if (supplemental_oxygen) {
    score += 2; // Supplemental oxygen
    if (oxygen_saturation <= 83) score += 3;
    else if (oxygen_saturation <= 85) score += 2;
    else if (oxygen_saturation <= 87) score += 1;
    else if (oxygen_saturation <= 92) score += 0;
    else if (oxygen_saturation <= 94) score += 1;
    else if (oxygen_saturation <= 96) score += 2;
    else score += 3;
  } else {
    if (oxygen_saturation <= 91) score += 3;
    else if (oxygen_saturation <= 93) score += 2;
    else if (oxygen_saturation <= 95) score += 1;
  }

  // Temperature
  if (temperature <= 35.0) score += 3;
  else if (temperature <= 36.0) score += 1;
  else if (temperature <= 38.0) score += 0;
  else if (temperature <= 39.0) score += 1;
  else score += 2;

  // Systolic blood pressure
  if (systolic_bp <= 90) score += 3;
  else if (systolic_bp <= 100) score += 2;
  else if (systolic_bp <= 110) score += 1;
  else if (systolic_bp <= 219) score += 0;
  else score += 3;

  // Heart rate
  if (heart_rate <= 40) score += 3;
  else if (heart_rate <= 50) score += 1;
  else if (heart_rate <= 90) score += 0;
  else if (heart_rate <= 110) score += 1;
  else if (heart_rate <= 130) score += 2;
  else score += 3;

  // Consciousness level: AVPU (anything other than ALERT scores 3)
  if (consciousness_level !== "ALERT") score += 3;

  // Bound between 0 and 20
  return Math.min(20, Math.max(0, score | 0));
}

export function validateVitals(vitals) {
  if (!vitals || typeof vitals !== "object") return false;
  const required = [
    "respiratory_rate",
    "oxygen_saturation",
    "supplemental_oxygen",
    "temperature",
    "systolic_bp",
    "heart_rate",
    "consciousness_level",
  ];
  for (const key of required) {
    if (!(key in vitals)) return false;
  }
  return true;
}
