import axios from 'axios';
import { Patient } from '../types/patient';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vitals conversion helpers
const vitalsToBackend = (vitals: Patient['vitals']) => ({
  respiratory_rate: vitals.respiratoryRate,
  oxygen_saturation: vitals.oxygenSat,
  supplemental_oxygen: vitals.oxygenSupport,
  temperature: vitals.temperature,
  systolic_bp: vitals.systolicBP,
  heart_rate: vitals.pulse,
  consciousness_level: mapConsciousnessToBackend(vitals.consciousness)
});

const mapConsciousnessToBackend = (consciousness: 'A' | 'C' | 'V' | 'P' | 'U') => {
  const mapping = {
    'A': 'ALERT',
    'C': 'CONFUSED', // Maps to CONFUSED for NEWS2 +1 point
    'V': 'VOICE',
    'P': 'PAIN',
    'U': 'UNRESPONSIVE'
  };
  return mapping[consciousness];
};

export interface AddPatientToEDRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female';
  phone: string;
  vitals: Patient['vitals'];
  symptoms: string;
  diagnosis: string;
  diseaseCode: string;
  severityIndex: number;
  resourceScore: number;
}

export interface AddPatientToEDResponse {
  message: string;
  patientExists: boolean;
  data: {
    patient: any;
    case: any;
  };
}

export interface SearchPatientResponse {
  message: string;
  exists: boolean;
  data?: any;
}

// Patient API
export const patientApi = {
  // Search for existing patient by phone
  searchByPhone: async (phone: string): Promise<SearchPatientResponse> => {
    const response = await api.get(`/patients/search`, { params: { phone } });
    return response.data;
  },

  // Search for patients by name
  searchByName: async (name: string) => {
    const response = await api.get(`/patients/search-by-name`, { params: { name } });
    return response.data;
  },

  // Add patient to ED (unified endpoint)
  addToED: async (data: AddPatientToEDRequest): Promise<AddPatientToEDResponse> => {
    const payload = {
      ...data,
      gender: data.gender === 'Male' ? 'MALE' : 'FEMALE',
      vitals: vitalsToBackend(data.vitals),
    };
    const response = await api.post('/patients/add-to-ed', payload);
    return response.data;
  },

  // Get all patients
  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  // Get patient by ID
  getById: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
};

// Triage API
export const triageApi = {
  // Get waiting queues
  getWaitingQueues: async () => {
    const response = await api.get('/triage/queues/waiting');
    return response.data;
  },

  // Get treatment queues
  getTreatmentQueues: async () => {
    const response = await api.get('/triage/queues/treatment');
    return response.data;
  },

  // Send patient to treatment
  sendToTreatment: async (caseId: string) => {
    const response = await api.post('/triage/treatment', { caseId });
    return response.data;
  },

  // Discharge patient
  dischargePatient: async (caseId: string) => {
    const response = await api.post('/triage/discharge', { caseId });
    return response.data;
  },

  // Update treatment duration
  updateTreatmentDuration: async (caseId: string, newDuration: number) => {
    const response = await api.post('/triage/treatment/update-duration', { caseId, newDuration });
    return response.data;
  },

  // Fill treatment slots
  fillTreatmentSlots: async () => {
    const response = await api.post('/triage/treatment/fill');
    return response.data;
  },

  // Auto discharge completed treatments
  autoDischarge: async () => {
    const response = await api.post('/triage/discharge/allCompleted');
    return response.data;
  },

  // Get treatment queue status
  getTreatmentQueueStatus: async () => {
    const response = await api.get('/triage/queues/treatment/status');
    return response.data;
  },

  // Get waiting queue status
  getWaitingQueueStatus: async () => {
    const response = await api.get('/triage/queues/waiting/status');
    return response.data;
  },
};

// Disease API
export const diseaseApi = {
  // Get all diseases
  getAll: async (params?: { severity?: number; search?: string }) => {
    const response = await api.get('/diseases', { params });
    return response.data;
  },

  // Get disease by code
  getByCode: async (code: string) => {
    const response = await api.get(`/diseases/${code}`);
    return response.data;
  },

  // Get disease statistics
  getStats: async () => {
    const response = await api.get('/diseases/stats');
    return response.data;
  },
};

export default api;
