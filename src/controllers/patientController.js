import prisma from "../lib/prisma.js";
import { calculateNEWS2 } from "../lib/news2.js";
import { assignZone, calculatePriorityScore, calculateAgeFactor } from "../lib/priority.js";
import { vitalsToBackend } from "../lib/vitalsMapping.js";
import { createCaseLog } from "../lib/logging.js";

/**
 * Helper function to extract individual vitals from backend vitals object
 * Maps backend field names to snake_case schema field names
 */
function extractVitalsForLogging(vitals) {
  return {
    respiratory_rate: vitals.respiratory_rate || 0,
    spo2: vitals.oxygen_saturation || 0,
    o2_device: vitals.supplemental_oxygen ? "O2" : "Air",
    bp_systolic: vitals.systolic_bp || 0,
    pulse_rate: vitals.heart_rate || 0,
    consciousness: vitals.consciousness_level || "Alert",
    temperature: vitals.temperature || 36.5,
  };
}

export const getPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ message: "Patients fetched successfully", data: patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { cases: { orderBy: { arrival_time: 'desc' } } }
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json({ message: "Patient fetched successfully", data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchPatientByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    
    const patient = await prisma.patient.findUnique({
      where: { phone },
      include: { 
        cases: { 
          orderBy: { arrival_time: 'desc' },
          take: 5 
        } 
      }
    });
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found", exists: false });
    }
    
    res.status(200).json({ 
      message: "Patient found", 
      exists: true,
      data: patient 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchPatientByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    
    const patients = await prisma.patient.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive'
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        cases: {
          orderBy: { arrival_time: 'desc' },
          take: 1
        }
      }
    });
    
    res.status(200).json({ 
      message: "Patients found", 
      count: patients.length,
      data: patients 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, dateOfBirth } = req.body;
    
    if (!name || !age || !gender || !phone || !dateOfBirth) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Check if patient already exists by phone
    const existingPatient = await prisma.patient.findUnique({
      where: { phone }
    });
    
    if (existingPatient) {
      return res.status(409).json({ 
        message: "Patient with this phone number already exists",
        data: existingPatient 
      });
    }
    
    const patient = await prisma.patient.create({
      data: { 
        name, 
        age: parseInt(age), 
        gender, 
        phone, 
        dateOfBirth
      },
    });
    
    res.status(201).json({ message: "Patient created successfully", data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unified endpoint: Check if patient exists, create if not, then create case
export const addPatientToED = async (req, res) => {
  try {
    const { 
      // Patient info
      firstName,
      lastName,
      dateOfBirth,
      age,
      gender,
      phone,
      // Case info
      vitals,
      symptoms,
      diagnosis,
      diseaseCode,
      severityIndex,
      resourceScore,
      maxWaitingTime,  // Optional: for manual disease entry
      estimatedTreatmentTime  // Optional: for manual disease entry
    } = req.body;
    
    // Handle optional symptoms field
    const symptomsValue = symptoms || null;

    // Validation with detailed error messages
    if (!firstName || !lastName || !age || !gender || !phone || !dateOfBirth) {
      const missingFields = [];
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!age) missingFields.push('age');
      if (!gender) missingFields.push('gender');
      if (!phone) missingFields.push('phone');
      if (!dateOfBirth) missingFields.push('dateOfBirth');
      return res.status(400).json({ message: `Missing required patient fields: ${missingFields.join(', ')}` });
    }
    if (!vitals) {
      return res.status(400).json({ message: "Missing required vitals" });
    }
    if (!diagnosis) {
      return res.status(400).json({ message: "Missing required diagnosis" });
    }

    const name = `${firstName} ${lastName}`;
    const ageInt = parseInt(age);

    // Check if patient exists by name and DOB (composite key)
    let patient = await prisma.patient.findUnique({
      where: { 
        name_dateOfBirth: {
          name,
          dateOfBirth
        }
      }
    });

    let patientExists = false;
    // Create patient if doesn't exist, otherwise update their info
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name,
          age: ageInt,
          gender: gender.toUpperCase(),
          phone,
          dateOfBirth
        }
      });
    } else {
      patientExists = true;
      // Update patient info (phone, age, gender might have changed)
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          age: ageInt,
          gender: gender.toUpperCase(),
          phone
        }
      });
    }

    // Fix: Accept both frontend and backend vitals formats
    let backendVitals;
    if (
      vitals &&
      typeof vitals === 'object' &&
      (
        vitals.respiratoryRate !== undefined ||
        vitals.oxygenSat !== undefined ||
        vitals.systolicBP !== undefined
      )
    ) {
      // Frontend format, convert
      backendVitals = vitalsToBackend(vitals);
    } else {
      // Already backend format
      backendVitals = vitals;
    }

    const news2 = calculateNEWS2(backendVitals);
    const si = severityIndex || 2;
    const zone = assignZone(news2, si);
    const arrivalTime = new Date();
    const ageFactor = calculateAgeFactor(ageInt);
    const resourceScoreValue = resourceScore || 2.0;
    const priority = calculatePriorityScore(zone, news2, si, 0, resourceScoreValue, ageInt);

    // Create case
    const patientCase = await prisma.patientCase.create({
      data: {
        patient_id: patient.id,
        zone,
        si,
        news2,
        resource_score: resourceScore || 2.0,
        age: ageInt,
        vitals: backendVitals,
        symptoms: symptomsValue,
        diagnosis,
        disease_code: diseaseCode,
        max_wait_time: maxWaitingTime,  // Store max_wait_time for manual entries
        treatment_duration: estimatedTreatmentTime,  // Store treatment time
        priority,
        arrival_time: arrivalTime,
        last_eval_time: arrivalTime,
        status: 'WAITING'
      },
      include: { patient: true }
    });

    // Auto-discharge if treatment time is 0
    if (patientCase.treatment_duration === 0) {
      await prisma.patientCase.update({
        where: { id: patientCase.id },
        data: { status: 'DISCHARGED', time_served: new Date() }
      });
    }

    // Create initial log entry for patient arrival
    // Get max_wait_time: try disease from DB first, then from PatientCase
    let maxWaitTime = patientCase.max_wait_time;
    if (diseaseCode) {
      const diseaseFromDb = await prisma.disease.findUnique({ where: { code: diseaseCode } });
      if (diseaseFromDb && diseaseFromDb.max_wait_time !== null) {
        maxWaitTime = diseaseFromDb.max_wait_time;
      }
    }

    const vitalFields = extractVitalsForLogging(backendVitals);
    
    await createCaseLog({
      patientId: patient.id,
      caseId: patientCase.id,
      zone,
      diseaseCode,
      priority,
      age: ageInt,
      sex: patient.gender,
      SI: si,
      NEWS2: news2,
      ...vitalFields,
      resource_score: resourceScore || 2.0,
      max_wait_time: maxWaitTime,
      current_wait_time: 0,
      total_time_in_system: 0,
      escalation: false,
      treatment_time: null,
      status: 'Waiting',
    });

    res.status(201).json({ 
      message: "Patient added to ED successfully", 
      patientExists,
      data: {
        patient,
        case: patientCase
      }
    });
  } catch (error) {
    console.error("Error adding patient to ED:", error);
    res.status(500).json({ message: error.message });
  }
};
