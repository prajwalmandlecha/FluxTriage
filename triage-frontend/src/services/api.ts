import axios from "axios";
import {
  QueuesResponse,
  CreatePatientData,
  CreateCaseData,
  Patient,
} from "../types";

const API_BASE_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const triageApi = {
  // Health check (note: health endpoint is at root level, not under /api)
  healthCheck: () => axios.get("http://localhost:3000/health"),

  // Patient endpoints
  getPatients: () => api.get<{ message: string; data: Patient[] }>("/patients"),
  getPatient: (id: string) => api.get<Patient>(`/patients/${id}`),
  createPatient: (data: CreatePatientData) =>
    api.post<{ message: string; data: Patient }>("/patients", data),

  // Triage endpoints
  createCase: (data: CreateCaseData) =>
    api.post<{ message: string; data: any }>("/triage/cases", data),

  getWaitingQueues: () => api.get<QueuesResponse>("/triage/queues/waiting"),
  getTreatmentQueues: () => api.get<QueuesResponse>("/triage/queues/treatment"),

  sendToTreatment: (caseId: string) =>
    api.post("/triage/treatment", { caseId }),

  dischargePatient: (caseId: string) =>
    api.post("/triage/discharge", { caseId }),

  fillTreatmentSlots: () => api.post("/triage/treatment/fill"),
  autoDischarge: () => api.post("/triage/discharge/allCompleted"),
};

export default api;
