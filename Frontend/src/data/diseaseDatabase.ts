import { Disease, PriorityWeights } from '../types/patient';

export const diseaseDatabase: Disease[] = [
  // RED Zone Diseases (SI = 4)
  { diseaseCode: 'R001', disease: 'Cardiac Arrest', severityIndex: 4, resourceScore: 5.0, estimatedTreatmentTime: 180, maxWaitingTime: 0 },
  { diseaseCode: 'R002', disease: 'Severe Trauma', severityIndex: 4, resourceScore: 4.8, estimatedTreatmentTime: 240, maxWaitingTime: 0 },
  { diseaseCode: 'R003', disease: 'Respiratory Failure', severityIndex: 4, resourceScore: 4.6, estimatedTreatmentTime: 150, maxWaitingTime: 0 },
  { diseaseCode: 'R004', disease: 'Stroke (Acute)', severityIndex: 4, resourceScore: 4.9, estimatedTreatmentTime: 200, maxWaitingTime: 0 },
  { diseaseCode: 'R005', disease: 'Severe Sepsis', severityIndex: 4, resourceScore: 4.7, estimatedTreatmentTime: 180, maxWaitingTime: 0 },
  { diseaseCode: 'R006', disease: 'Anaphylactic Shock', severityIndex: 4, resourceScore: 4.4, estimatedTreatmentTime: 120, maxWaitingTime: 0 },
  { diseaseCode: 'R007', disease: 'Major Burns', severityIndex: 4, resourceScore: 4.9, estimatedTreatmentTime: 300, maxWaitingTime: 0 },
  { diseaseCode: 'R008', disease: 'Severe Hemorrhage', severityIndex: 4, resourceScore: 4.8, estimatedTreatmentTime: 180, maxWaitingTime: 0 },

  // ORANGE Zone Diseases (SI = 3)
  { diseaseCode: 'O001', disease: 'Chest Pain (Cardiac)', severityIndex: 3, resourceScore: 3.8, estimatedTreatmentTime: 120, maxWaitingTime: 15 },
  { diseaseCode: 'O002', disease: 'Severe Asthma', severityIndex: 3, resourceScore: 3.5, estimatedTreatmentTime: 90, maxWaitingTime: 20 },
  { diseaseCode: 'O003', disease: 'Diabetic Ketoacidosis', severityIndex: 3, resourceScore: 3.9, estimatedTreatmentTime: 150, maxWaitingTime: 15 },
  { diseaseCode: 'O004', disease: 'Acute Abdomen', severityIndex: 3, resourceScore: 3.6, estimatedTreatmentTime: 120, maxWaitingTime: 30 },
  { diseaseCode: 'O005', disease: 'Head Injury (Moderate)', severityIndex: 3, resourceScore: 3.7, estimatedTreatmentTime: 180, maxWaitingTime: 20 },
  { diseaseCode: 'O006', disease: 'Severe Dehydration', severityIndex: 3, resourceScore: 3.2, estimatedTreatmentTime: 90, maxWaitingTime: 30 },
  { diseaseCode: 'O007', disease: 'Drug Overdose', severityIndex: 3, resourceScore: 3.6, estimatedTreatmentTime: 120, maxWaitingTime: 15 },
  { diseaseCode: 'O008', disease: 'Seizure (Active)', severityIndex: 3, resourceScore: 3.4, estimatedTreatmentTime: 90, maxWaitingTime: 10 },

  // YELLOW Zone Diseases (SI = 2)
  { diseaseCode: 'Y001', disease: 'Fracture (Suspected)', severityIndex: 2, resourceScore: 2.5, estimatedTreatmentTime: 60, maxWaitingTime: 60 },
  { diseaseCode: 'Y002', disease: 'Moderate Laceration', severityIndex: 2, resourceScore: 2.2, estimatedTreatmentTime: 45, maxWaitingTime: 45 },
  { diseaseCode: 'Y003', disease: 'Pneumonia', severityIndex: 2, resourceScore: 2.8, estimatedTreatmentTime: 90, maxWaitingTime: 60 },
  { diseaseCode: 'Y004', disease: 'UTI (Complicated)', severityIndex: 2, resourceScore: 2.1, estimatedTreatmentTime: 30, maxWaitingTime: 90 },
  { diseaseCode: 'Y005', disease: 'Gastroenteritis', severityIndex: 2, resourceScore: 2.0, estimatedTreatmentTime: 30, maxWaitingTime: 120 },
  { diseaseCode: 'Y006', disease: 'Migraine (Severe)', severityIndex: 2, resourceScore: 1.8, estimatedTreatmentTime: 30, maxWaitingTime: 60 },
  { diseaseCode: 'Y007', disease: 'Vertigo', severityIndex: 2, resourceScore: 1.9, estimatedTreatmentTime: 45, maxWaitingTime: 90 },
  { diseaseCode: 'Y008', disease: 'Chest Pain (Non-cardiac)', severityIndex: 2, resourceScore: 2.3, estimatedTreatmentTime: 60, maxWaitingTime: 60 },

  // GREEN Zone Diseases (SI = 1)
  { diseaseCode: 'G001', disease: 'Minor Laceration', severityIndex: 1, resourceScore: 1.5, estimatedTreatmentTime: 20, maxWaitingTime: 180 },
  { diseaseCode: 'G002', disease: 'Sprain/Strain', severityIndex: 1, resourceScore: 1.3, estimatedTreatmentTime: 25, maxWaitingTime: 240 },
  { diseaseCode: 'G003', disease: 'Upper Respiratory Infection', severityIndex: 1, resourceScore: 1.1, estimatedTreatmentTime: 15, maxWaitingTime: 300 },
  { diseaseCode: 'G004', disease: 'Skin Rash', severityIndex: 1, resourceScore: 1.2, estimatedTreatmentTime: 20, maxWaitingTime: 240 },
  { diseaseCode: 'G005', disease: 'Constipation', severityIndex: 1, resourceScore: 1.0, estimatedTreatmentTime: 15, maxWaitingTime: 360 },
  { diseaseCode: 'G006', disease: 'Minor Burns', severityIndex: 1, resourceScore: 1.6, estimatedTreatmentTime: 30, maxWaitingTime: 180 },
  { diseaseCode: 'G007', disease: 'Allergic Reaction (Mild)', severityIndex: 1, resourceScore: 1.4, estimatedTreatmentTime: 25, maxWaitingTime: 120 },
  { diseaseCode: 'G008', disease: 'Earache', severityIndex: 1, resourceScore: 1.1, estimatedTreatmentTime: 15, maxWaitingTime: 240 }
];

/**
 * Zone-specific weights for priority score calculation
 * 
 * Each zone has different weighting factors optimized through external analysis.
 * These weights match the backend implementation in src/lib/priority.js
 * 
 * Note: Wait time (wT) is the dominant factor across all zones (0.72-1.0),
 * ensuring fair queue management while still prioritizing clinical urgency.
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

export function getDiseaseByCode(diseaseCode: string): Disease | undefined {
  return diseaseDatabase.find(disease => disease.diseaseCode === diseaseCode);
}

export function getDiseasesByName(searchTerm: string): Disease[] {
  return diseaseDatabase.filter(disease => 
    disease.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function getAllDiseases(): Disease[] {
  return diseaseDatabase;
}