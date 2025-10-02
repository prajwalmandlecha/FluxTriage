// NEWS2 calculation matching official NHS scoring
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

  // Respiratory Rate
  if (respiratory_rate <= 8) {
    score += 3;
  } else if (respiratory_rate >= 9 && respiratory_rate <= 11) {
    score += 1;
  } else if (respiratory_rate >= 21 && respiratory_rate <= 24) {
    score += 2;
  } else if (respiratory_rate >= 25) {
    score += 3;
  }
  // 12-20 = 0 points

  // SpO2 (on room air)
  if (oxygen_saturation < 85) {
    score += 3;
  } else if (oxygen_saturation >= 85 && oxygen_saturation <= 89) {
    score += 2;
  } else if (oxygen_saturation >= 90 && oxygen_saturation <= 93) {
    score += 1;
  }
  // >= 94 = 0 points

  // Supplemental O2
  if (supplemental_oxygen) {
    score += 2;
  }

  // Systolic BP
  if (systolic_bp <= 90 || systolic_bp >= 220) {
    score += 3;
  } else if (
    (systolic_bp >= 91 && systolic_bp <= 100) ||
    (systolic_bp >= 201 && systolic_bp <= 219)
  ) {
    score += 2;
  } else if (systolic_bp >= 101 && systolic_bp <= 110) {
    score += 1;
  }
  // 111-219 = 0 points

  // Heart Rate (Pulse)
  if (heart_rate <= 40 || heart_rate >= 131) {
    score += 3;
  } else if (heart_rate >= 111 && heart_rate <= 130) {
    score += 2;
  } else if (
    (heart_rate >= 41 && heart_rate <= 50) ||
    (heart_rate >= 91 && heart_rate <= 110)
  ) {
    score += 1;
  }
  // 51-90 = 0 points

  // Temperature (in Celsius)
  if (temperature <= 35.0) {
    score += 3;
  } else if (temperature >= 39.1) {
    score += 2;
  } else if (temperature >= 35.1 && temperature <= 36.0) {
    score += 1;
  } else if (temperature >= 38.1 && temperature <= 39.0) {
    score += 1;
  }
  // 36.1-38.0 = 0 points

  // Consciousness Level (ACVPU)
  if (
    consciousness_level === "PAIN" ||
    consciousness_level === "UNRESPONSIVE" ||
    consciousness_level === "VOICE" ||
    consciousness_level === "CONFUSED"
  ) {
    score += 3;
  }
  // ALERT = 0 points

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
