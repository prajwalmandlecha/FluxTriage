export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // computed from firstName + lastName
  dateOfBirth: string;
  age: number; // computed from DOB
  gender: 'Male' | 'Female';
  priority: 'Red' | 'Orange' | 'Yellow' | 'Green';
  priorityScore: number; // New priority formula result
  vitals: {
    respiratoryRate: number;
    oxygenSat: number;
    oxygenSupport: boolean; // whether patient is on supplemental O2
    systolicBP: number;
    pulse: number;
    temperature: number;
    consciousness: 'A' | 'C' | 'V' | 'P' | 'U'; // ACVPU scale
  };
  symptoms: string;
  diagnosis: string;
  diseaseCode: string;
  severityIndex: number; // SI: 1-4 (Green to Red)
  resourceScore: number;
  estimatedTreatmentTime: number;
  maxWaitingTime: number | null; // null when disease data unavailable, 0 is valid for critical patients
  news2Score: number;
  waitingTime: number; // in minutes
  treatmentTime: number; // in minutes, only for IN_TREATMENT
  status: string; // WAITING, IN_TREATMENT, DISCHARGED
  arrivalTime: Date;
  contactNumber: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse' | 'Technician';
  specialization?: string;
  contactNumber: string;
  shift: 'Morning' | 'Evening' | 'Night';
  status: 'Available' | 'Busy' | 'Break';
}

export interface TreatmentBed {
  id: string;
  bedNumber: string;
  caseId?: string; // Backend case ID for API calls
  patient: Patient | null;
  remainingTime: number; // in minutes
  treatmentStartTime: Date | null;
}

export interface TriageZone {
  priority: 'Red' | 'Orange' | 'Yellow' | 'Green';
  name: string;
  color: string;
  bgColor: string;
  waitingQueue: Patient[];
  treatmentQueue: TreatmentBed[];
  maxBeds: number;
}

export interface DashboardKPIs {
  totalPatients: number;
  avgWaitTime: number;
  bedOccupancy: number;
  totalBeds: number;
  criticalCases: number;
}

export interface ZoneOverview {
  priority: 'Red' | 'Orange' | 'Yellow' | 'Green';
  name: string;
  waitingCount: number;
  treatmentCount: number;
  avgWaitTime: number;
  commonDiseases: string[];
}

export interface SearchResult {
  type: 'Patient';
  id: string;
  name: string;
  details: Patient;
}

export interface Disease {
  diseaseCode: string;
  disease: string;
  severityIndex: number; // 1-4 (Green to Red)
  resourceScore: number;
  estimatedTreatmentTime: number; // in minutes
  maxWaitingTime: number; // in minutes
}

export interface PriorityWeights {
  wNEWS2: number;
  wSI: number;
  wT: number;
  wR: number;
  wA: number;
}

export interface ZonePriorityWeights {
  RED: PriorityWeights;
  ORANGE: PriorityWeights;
  YELLOW: PriorityWeights;
  GREEN: PriorityWeights;
}