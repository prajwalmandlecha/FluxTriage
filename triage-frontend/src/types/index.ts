export type Zone = "RED" | "ORANGE" | "YELLOW" | "GREEN";

export type CaseStatus =
  | "WAITING"
  | "IN_TREATMENT"
  | "DISCHARGED"
  | "TRANSFERRED";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  medical_history?: any;
  created_at: string;
  updated_at: string;
}

export interface PatientCase {
  id: string;
  zone: Zone;
  si: number;
  news2: number;
  resource_score: number;
  age: number;
  priority: number;
  treatment_duration?: number;
  status: CaseStatus;
  arrival_time: string;
  last_eval_time: string;
  time_served?: string;
  disease_code?: string;
  patient_id: string;
  patient: Patient;
}

export interface QueueData {
  cases: PatientCase[];
  count: number;
  capacity?: number;
  available?: number;
}

export interface QueuesResponse {
  message: string;
  data: {
    RED: QueueData;
    ORANGE: QueueData;
    YELLOW: QueueData;
    GREEN: QueueData;
  };
}

export interface CreatePatientData {
  name: string;
  age: string;
  gender: Gender;
  phone: string;
  email?: string;
  medical_history?: any;
}

export interface CreateCaseData {
  id: string;
  news2: number;
  si: number;
  resourceScore: number;
  age: number;
}
