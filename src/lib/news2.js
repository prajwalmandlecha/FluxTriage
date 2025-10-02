// NEWS2 calculation matching frontend logic
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
  if (respiratory_rate <= 8 || respiratory_rate >= 30) {
    score += 3; // RED
  } else if (respiratory_rate >= 25 && respiratory_rate <= 29) {
    score += 2; // ORANGE
  } else if (respiratory_rate >= 21 && respiratory_rate <= 24) {
    score += 1; // YELLOW
  }
  // 12-20 = 0 points (GREEN)

  // SpO2
  if (oxygen_saturation < 85) {
    score += 3; // RED
  } else if (oxygen_saturation >= 85 && oxygen_saturation <= 89) {
    score += 2; // ORANGE
  } else if (oxygen_saturation >= 90 && oxygen_saturation <= 93) {
    score += 1; // YELLOW
  }
  // >= 94 = 0 points (GREEN)

  // Supplemental O2
  if (supplemental_oxygen) {
    score += 3;
  }

  // Systolic BP
  if (systolic_bp <= 90 || systolic_bp >= 220) {
    score += 3; // RED
  } else if ((systolic_bp >= 91 && systolic_bp <= 100) || 
             (systolic_bp >= 201 && systolic_bp <= 219)) {
    score += 2; // ORANGE
  } else if ((systolic_bp >= 101 && systolic_bp <= 110) || 
             (systolic_bp >= 181 && systolic_bp <= 200)) {
    score += 1; // YELLOW
  }
  // 111-180 = 0 points (GREEN)

  // Heart Rate (Pulse)
  if (heart_rate <= 40 || heart_rate >= 130) {
    score += 3; // RED
  } else if ((heart_rate >= 41 && heart_rate <= 50) || 
             (heart_rate >= 111 && heart_rate <= 129)) {
    score += 2; // ORANGE
  } else if ((heart_rate >= 51 && heart_rate <= 90) || 
             (heart_rate >= 101 && heart_rate <= 110)) {
    score += 1; // YELLOW
  }
  // 91-100 = 0 points (GREEN)

  // Temperature (in Celsius)
  if (temperature <= 35.0 || temperature >= 39.1) {
    score += 3; // RED
  } else if ((temperature >= 35.1 && temperature <= 36.0) || 
             (temperature >= 38.1 && temperature <= 39.0)) {
    score += 2; // ORANGE
  } else if ((temperature >= 36.1 && temperature <= 36.9) || 
             (temperature >= 37.5 && temperature <= 38.0)) {
    score += 1; // YELLOW
  }
  // 37.0-37.4 = 0 points (GREEN)

  // Consciousness Level (ACVPU mapped)
  // P or U = 3, V = 2, C = 1, A = 0
  if (consciousness_level === "PAIN" || consciousness_level === "UNRESPONSIVE") {
    score += 3; // RED
  } else if (consciousness_level === "VOICE") {
    score += 2; // ORANGE
  } else if (consciousness_level === "CONFUSED" || consciousness_level === "CVPU") {
    score += 1; // YELLOW
  }
  // ALERT = 0 points (GREEN)

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
