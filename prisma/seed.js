import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const diseases = [
  // Critical (Zone 4) - 13 diseases
  { code: 'I46.9', name: 'Cardiac Arrest', description: 'Sudden cessation of cardiac activity', treatment_time: 60, max_wait_time: 0, severity: 4 },
  { code: 'I21.0', name: 'STEMI', description: 'ST-Elevation Myocardial Infarction', treatment_time: 90, max_wait_time: 0, severity: 4 },
  { code: 'I21.9', name: 'Acute Myocardial Infarction', description: 'Heart attack', treatment_time: 90, max_wait_time: 0, severity: 4 },
  { code: 'I63.9', name: 'Cerebral Infarction (Stroke)', description: 'Ischemic stroke', treatment_time: 120, max_wait_time: 0, severity: 4 },
  { code: 'I61.9', name: 'Intracerebral Hemorrhage', description: 'Bleeding within the brain', treatment_time: 180, max_wait_time: 0, severity: 4 },
  { code: 'I60.9', name: 'Subarachnoid Hemorrhage', description: 'Bleeding in the space around the brain', treatment_time: 180, max_wait_time: 0, severity: 4 },
  { code: 'J96.00', name: 'Acute Respiratory Failure', description: 'Severe breathing difficulty', treatment_time: 120, max_wait_time: 5, severity: 4 },
  { code: 'J81.0', name: 'Acute Pulmonary Edema', description: 'Fluid in the lungs', treatment_time: 120, max_wait_time: 5, severity: 4 },
  { code: 'A41.9', name: 'Sepsis', description: 'Systemic infection response', treatment_time: 180, max_wait_time: 10, severity: 4 },
  { code: 'R65.20', name: 'Severe Sepsis', description: 'Sepsis with organ dysfunction', treatment_time: 180, max_wait_time: 10, severity: 4 },
  { code: 'T78.2XXA', name: 'Anaphylactic Shock', description: 'Severe allergic reaction', treatment_time: 60, max_wait_time: 0, severity: 4 },
  { code: 'T79.4XXA', name: 'Traumatic Shock', description: 'Shock from severe trauma', treatment_time: 90, max_wait_time: 0, severity: 4 },
  { code: 'G40.911', name: 'Status Epilepticus', description: 'Prolonged seizure', treatment_time: 90, max_wait_time: 0, severity: 4 },

  // Urgent (Zone 3) - 14 diseases
  { code: 'I50.9', name: 'Heart Failure', description: 'Acute heart failure exacerbation', treatment_time: 150, max_wait_time: 15, severity: 3 },
  { code: 'J18.9', name: 'Pneumonia', description: 'Lung infection', treatment_time: 180, max_wait_time: 30, severity: 3 },
  { code: 'J44.1', name: 'COPD Exacerbation', description: 'Worsening of chronic lung disease', treatment_time: 150, max_wait_time: 30, severity: 3 },
  { code: 'J45.901', name: 'Acute Asthma Exacerbation', description: 'Severe asthma attack', treatment_time: 120, max_wait_time: 15, severity: 3 },
  { code: 'K35.80', name: 'Acute Appendicitis', description: 'Inflamed appendix', treatment_time: 240, max_wait_time: 60, severity: 3 },
  { code: 'K92.2', name: 'GI Bleeding', description: 'Gastrointestinal hemorrhage', treatment_time: 180, max_wait_time: 30, severity: 3 },
  { code: 'K56.60', name: 'Bowel Obstruction', description: 'Intestinal blockage', treatment_time: 240, max_wait_time: 60, severity: 3 },
  { code: 'N17.9', name: 'Acute Kidney Injury', description: 'Sudden kidney failure', treatment_time: 180, max_wait_time: 60, severity: 3 },
  { code: 'N20.0', name: 'Renal Colic', description: 'Kidney stone pain', treatment_time: 120, max_wait_time: 60, severity: 3 },
  { code: 'E10.10', name: 'Diabetic Ketoacidosis', description: 'Severe diabetes complication', treatment_time: 180, max_wait_time: 30, severity: 3 },
  { code: 'S06.9XXA', name: 'Traumatic Brain Injury', description: 'Head trauma', treatment_time: 180, max_wait_time: 30, severity: 3 },
  { code: 'S27.0XXA', name: 'Traumatic Pneumothorax', description: 'Collapsed lung from injury', treatment_time: 120, max_wait_time: 30, severity: 3 },
  { code: 'G45.9', name: 'Transient Ischemic Attack', description: 'Mini-stroke', treatment_time: 180, max_wait_time: 30, severity: 3 },
  { code: 'R07.9', name: 'Chest Pain (Unstable)', description: 'Chest pain requiring immediate evaluation', treatment_time: 150, max_wait_time: 30, severity: 3 },

  // Less Urgent (Zone 2) - 16 diseases
  { code: 'S93.40XA', name: 'Ankle Sprain', description: 'Twisted ankle', treatment_time: 60, max_wait_time: 90, severity: 2 },
  { code: 'S61.401A', name: 'Laceration (Simple)', description: 'Minor cut requiring sutures', treatment_time: 45, max_wait_time: 90, severity: 2 },
  { code: 'S52.501A', name: 'Forearm Fracture', description: 'Broken forearm bone', treatment_time: 120, max_wait_time: 90, severity: 2 },
  { code: 'R51', name: 'Headache (Moderate)', description: 'Persistent headache', treatment_time: 90, max_wait_time: 120, severity: 2 },
  { code: 'R10.9', name: 'Abdominal Pain (Moderate)', description: 'Stomach pain requiring evaluation', treatment_time: 120, max_wait_time: 120, severity: 2 },
  { code: 'N39.0', name: 'Urinary Tract Infection', description: 'Bladder infection', treatment_time: 90, max_wait_time: 120, severity: 2 },
  { code: 'N10', name: 'Pyelonephritis', description: 'Kidney infection', treatment_time: 150, max_wait_time: 90, severity: 2 },
  { code: 'K21.9', name: 'GERD', description: 'Gastroesophageal reflux disease', treatment_time: 60, max_wait_time: 120, severity: 2 },
  { code: 'M79.3', name: 'Back Pain (Acute)', description: 'Sudden onset back pain', treatment_time: 60, max_wait_time: 120, severity: 2 },
  { code: 'J06.9', name: 'Upper Respiratory Infection', description: 'Cold or flu symptoms', treatment_time: 45, max_wait_time: 120, severity: 2 },
  { code: 'J02.9', name: 'Acute Pharyngitis', description: 'Severe sore throat', treatment_time: 45, max_wait_time: 120, severity: 2 },
  { code: 'H10.9', name: 'Conjunctivitis', description: 'Pink eye', treatment_time: 30, max_wait_time: 120, severity: 2 },
  { code: 'L03.90', name: 'Cellulitis', description: 'Skin infection', treatment_time: 90, max_wait_time: 120, severity: 2 },
  { code: 'T14.90XA', name: 'Minor Trauma', description: 'Minor injury', treatment_time: 60, max_wait_time: 120, severity: 2 },
  { code: 'R50.9', name: 'Fever', description: 'Elevated temperature', treatment_time: 75, max_wait_time: 120, severity: 2 },
  { code: 'N94.6', name: 'Dysmenorrhea', description: 'Severe menstrual cramps', treatment_time: 60, max_wait_time: 120, severity: 2 },

  // Low Care (Zone 1) - 8 diseases
  { code: 'Z79.4', name: 'Prescription Refill', description: 'Medication renewal', treatment_time: 30, max_wait_time: 180, severity: 1 },
  { code: 'B34.9', name: 'Viral Infection (Minor)', description: 'Minor viral illness', treatment_time: 30, max_wait_time: 180, severity: 1 },
  { code: 'R05', name: 'Cough (Non-productive)', description: 'Mild cough', treatment_time: 30, max_wait_time: 180, severity: 1 },
  { code: 'R11.0', name: 'Nausea', description: 'Feeling sick', treatment_time: 45, max_wait_time: 180, severity: 1 },
  { code: 'R42', name: 'Dizziness (Mild)', description: 'Lightheadedness', treatment_time: 60, max_wait_time: 180, severity: 1 },
  { code: 'L30.9', name: 'Dermatitis', description: 'Skin rash', treatment_time: 30, max_wait_time: 240, severity: 1 },
  { code: 'Z00.00', name: 'General Medical Exam', description: 'Routine check-up', treatment_time: 45, max_wait_time: 240, severity: 1 },
  { code: 'R53.83', name: 'Fatigue', description: 'General tiredness', treatment_time: 45, max_wait_time: 240, severity: 1 },
];

async function main() {
  console.log('Starting database seed...');

  // Clear existing diseases
  console.log('Clearing existing diseases...');
  await prisma.disease.deleteMany({});

  // Insert new diseases
  console.log('Inserting diseases...');
  for (const disease of diseases) {
    await prisma.disease.create({
      data: disease,
    });
  }

  console.log(`✅ Seeded ${diseases.length} diseases successfully!`);
  console.log('Disease breakdown:');
  console.log('  - Critical (Severity 4): 13 diseases');
  console.log('  - Urgent (Severity 3): 14 diseases');
  console.log('  - Less Urgent (Severity 2): 16 diseases');
  console.log('  - Low Care (Severity 1): 8 diseases');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
