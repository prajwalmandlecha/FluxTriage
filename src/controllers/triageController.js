import prisma from "../lib/prisma.js";
import cron from "node-cron";
import { calculateNEWS2, validateVitals } from "../lib/news2.js";
import { assignZone, calculatePriorityScore, calculateAgeFactor } from "../lib/priority.js";
import { createCaseLog } from "../lib/logging.js";

/**
 * Helper function to extract individual vitals from backend vitals object
 * Maps backend field names to snake_case schema field names
 * 
 * @param {Object} vitals - Backend vitals object
 * @returns {Object} Individual vitals fields for logging
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

//treatment capacities
const TreatmentCapacity = {
  RED: 5,
  ORANGE: 8,
  YELLOW: 10,
  GREEN: 15,
};

//check zone capacity
const checkZoneCapacity = async (zone) => {
  const currentInTreatment = await prisma.patientCase.count({
    where: {
      zone: zone,
      status: "IN_TREATMENT",
    },
  });

  return currentInTreatment < TreatmentCapacity[zone];
};

export const createCase = async (req, res) => {
  try {
    const { id, si, resourceScore, age, disease_code, vitals } = req.body;

    if (!id || si == null || resourceScore == null || age == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!validateVitals(vitals)) {
      return res.status(400).json({ message: "Invalid or missing vitals" });
    }

    const ageInt = parseInt(age);
    if (isNaN(ageInt) || ageInt < 0) {
      return res.status(400).json({ message: "Invalid age value" });
    }

    const computedNews2 = calculateNEWS2(vitals);
    const zone = assignZone(computedNews2, si);
    const arrival = new Date();
    const ageFactor = calculateAgeFactor(ageInt);

    const priority = calculatePriorityScore(
      zone,
      computedNews2,
      si,
      0, // Initial waiting time is 0
      resourceScore,
      ageInt
    );

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const newCase = await prisma.patientCase.create({
      data: {
        patient_id: id,
        news2: computedNews2,
        si,
        resource_score: resourceScore,
        age: ageInt,
        vitals: vitals,
        arrival_time: arrival,
        last_eval_time: arrival,
        zone,
        priority,
        disease_code,
      },
    });

    // Create initial log entry for patient arrival
    const diseaseData = disease_code ? await prisma.disease.findUnique({ where: { code: disease_code } }) : null;
    const maxWaitTime = diseaseData?.max_wait_time ?? null;
    const vitalFields = extractVitalsForLogging(vitals);
    
    await createCaseLog({
      patientId: id,
      caseId: newCase.id,
      zone,
      diseaseCode: disease_code,
      priority,
      age: ageInt,
      sex: patient.gender,
      SI: si,
      NEWS2: computedNews2,
      ...vitalFields,
      resource_score: resourceScore,
      max_wait_time: maxWaitTime,
      current_wait_time: 0,
      total_time_in_system: 0,
      escalation: false,
      treatment_time: null,
      status: "Waiting",
    });

    //temporary disable
    // await recalculateAllPriorities();

    // Attempt to fill treatment slots immediately if capacity is available
    await fillTreatmentSlots();

    return res.json({ message: "Case created successfully", data: newCase });
  } catch (error) {
    console.error("Error creating case:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getWaitingQueues = async (req, res) => {
  try {
    const zones = ["RED", "ORANGE", "YELLOW", "GREEN"];
    const queues = {};

      for (const zone of zones) {
        const rawCases = await prisma.patientCase.findMany({
          where: { zone, status: "WAITING" },
          orderBy: { priority: "desc" },
          include: {
            patient: true,
            disease: true, // Include disease data for max_wait_time
          },
        });

        const now = new Date();
        const cases = rawCases.map((patientCase) => {
          const arrival = new Date(patientCase.arrival_time);
          const waitingMinutes = Math.max(
            0,
            Math.floor((now.getTime() - arrival.getTime()) / 60000)
          );

          const maxWait = patientCase.disease?.max_wait_time ?? patientCase.max_wait_time ?? null;

          return {
            ...patientCase,
            waiting_minutes: waitingMinutes,
            max_wait_time: maxWait,
          };
        });

        queues[zone] = {
          cases,
          count: cases.length,
        };
      }

    return res.status(200).json({
      message: "Waiting queues fetched successfully",
      data: queues,
    });
  } catch (error) {
    console.error("Error fetching waiting queues:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTreatmentQueues = async (req, res) => {
  try {
    const zones = ["RED", "ORANGE", "YELLOW", "GREEN"];
    const treatmentQueues = {};

    for (const zone of zones) {
      const rawCases = await prisma.patientCase.findMany({
        where: { zone, status: "IN_TREATMENT" },
        include: {
          patient: true,
          disease: true, // Include disease data for max_wait_time and treatment_time
        },
      });

      const now = new Date();
      const casesWithRemainingTime = rawCases
        .map((patientCase) => {
          const startedAt = new Date(patientCase.last_eval_time);
          const elapsedMinutes = Math.max(
            0,
            Math.floor((now.getTime() - startedAt.getTime()) / 60000)
          );
          const totalDuration = patientCase.treatment_duration || 0;
          const remaining = Math.max(0, totalDuration - elapsedMinutes);

          return {
            ...patientCase,
            remaining_treatment_minutes: remaining,
          };
        })
        .sort(
          (a, b) =>
            (a.remaining_treatment_minutes || 0) -
            (b.remaining_treatment_minutes || 0)
        );

      treatmentQueues[zone] = {
        cases: casesWithRemainingTime,
        count: casesWithRemainingTime.length,
        capacity: TreatmentCapacity[zone],
        available: TreatmentCapacity[zone] - casesWithRemainingTime.length,
      };
    }

    return res.status(200).json({
      message: "Treatment queues fetched successfully",
      data: treatmentQueues,
    });
  } catch (error) {
    console.error("Error fetching treatment queues:", error);
    return res.status(500).json({ message: error.message });
  }
};

//if zone has space, move case to treatment
export const sendToTreatment = async (req, res) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ message: "caseId is required" });
    }

    const patientCase = await prisma.patientCase.findUnique({
      where: { id: caseId },
    });

    if (!patientCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const isZoneAvailable = await checkZoneCapacity(patientCase.zone);

    if (!isZoneAvailable) {
      return res.status(400).json({
        message: `No available treatment slots in ${patientCase.zone} zone`,
      });
    }

    const disease = await prisma.disease.findUnique({
      where: { code: patientCase.disease_code || "" },
    });

    let treatmentDuration = 1;
    if (disease && disease.treatment_time) {
      treatmentDuration = disease.treatment_time;
    }

    const updatedCase = await prisma.patientCase.update({
      where: { id: caseId },
      data: {
        status: "IN_TREATMENT",
        treatment_duration: treatmentDuration,
        last_eval_time: new Date(),
      },
    });

    // Create log entry for treatment start
    const patientData = await prisma.patient.findUnique({
      where: { id: updatedCase.patient_id }
    });
    
    // Current wait time = time from arrival to now (this gets FROZEN when entering treatment)
    const currentWaitTime = Math.floor(
      (updatedCase.last_eval_time.getTime() - updatedCase.arrival_time.getTime()) / 60000
    );
    const totalTimeInSystem = currentWaitTime; // Same as wait time when entering treatment
    
    let maxWaitTime = disease?.max_wait_time ?? updatedCase.max_wait_time ?? null;
    if (typeof maxWaitTime === "string") maxWaitTime = parseFloat(maxWaitTime);
    if (isNaN(maxWaitTime)) maxWaitTime = null;
    
  const escalation = maxWaitTime !== null ? currentWaitTime > maxWaitTime : false;
    
    const vitalFields = extractVitalsForLogging(updatedCase.vitals || {});
    
    await createCaseLog({
      patientId: updatedCase.patient_id,
      caseId: updatedCase.id,
      zone: updatedCase.zone,
      diseaseCode: updatedCase.disease_code,
      priority: updatedCase.priority,
      age: updatedCase.age,
      sex: patientData.gender,
      SI: updatedCase.si,
      NEWS2: updatedCase.news2,
      ...vitalFields,
      resource_score: updatedCase.resource_score,
      max_wait_time: maxWaitTime,
      current_wait_time: currentWaitTime, // Frozen wait time
      total_time_in_system: totalTimeInSystem,
      escalation,
      treatment_time: 0, // Treatment just started, so treatment time is 0
      status: "IN_TREATMENT",
    });

    await recalculateAllPriorities();

    return res
      .status(200)
      .json({ message: "Case sent to treatment", data: updatedCase });
  } catch (error) {
    console.error("Error sending case to treatment:", error);

    return res.status(500).json({ message: error.message });
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ message: "caseId is required" });
    }

    const patientCase = await prisma.patientCase.findUnique({
      where: { id: caseId },
    });

    if (!patientCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const updatedCase = await prisma.patientCase.update({
      where: { id: caseId },
      data: {
        status: "DISCHARGED",
        time_served: new Date(),
        last_eval_time: new Date(),
      },
    });

    // Create log entry for patient discharge
    const patientData = await prisma.patient.findUnique({
      where: { id: updatedCase.patient_id }
    });
    
    // Get the last IN_TREATMENT log to retrieve the frozen current_wait_time
    const lastTreatmentLog = await prisma.caseLog.findFirst({
      where: { 
        case_id: updatedCase.id,
        status: "IN_TREATMENT"
      },
      orderBy: { timestamp: "desc" }
    });
    
    const totalTimeInSystem = Math.floor(
      (updatedCase.last_eval_time.getTime() - updatedCase.arrival_time.getTime()) / 60000
    );
    
    // Use frozen wait time from when patient entered treatment
    const currentWaitTime = lastTreatmentLog?.current_wait_time ?? totalTimeInSystem;
    
    // Calculate treatment time: total time - wait time
    const treatmentTime = totalTimeInSystem - currentWaitTime;
    
    const diseaseData = updatedCase.disease_code 
      ? await prisma.disease.findUnique({ where: { code: updatedCase.disease_code } })
      : null;
    let maxWaitTime = diseaseData?.max_wait_time ?? updatedCase.max_wait_time ?? null;
    if (typeof maxWaitTime === "string") maxWaitTime = parseFloat(maxWaitTime);
    if (isNaN(maxWaitTime)) maxWaitTime = null;
    
  const escalation = maxWaitTime !== null ? currentWaitTime > maxWaitTime : false;
    
    const vitalFields = extractVitalsForLogging(updatedCase.vitals || {});
    
    await createCaseLog({
      patientId: updatedCase.patient_id,
      caseId: updatedCase.id,
      zone: updatedCase.zone,
      diseaseCode: updatedCase.disease_code,
      priority: updatedCase.priority,
      age: updatedCase.age,
      sex: patientData.gender,
      SI: updatedCase.si,
      NEWS2: updatedCase.news2,
      ...vitalFields,
      resource_score: updatedCase.resource_score,
      max_wait_time: maxWaitTime,
      current_wait_time: currentWaitTime,
      total_time_in_system: totalTimeInSystem,
      escalation,
      treatment_time: treatmentTime,
      status: "DISCHARGED",
    });

    await fillTreatmentSlots();

    return res.status(200).json({
      message: "Patient discharged, treatment slots filled",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Error discharging patient:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateTreatmentDuration = async (req, res) => {
  try {
    const { caseId, newDuration } = req.body;
    
    if (!caseId) {
      return res.status(400).json({ message: "caseId is required" });
    }
    
    if (newDuration == null || newDuration < 0) {
      return res.status(400).json({ message: "Valid newDuration is required" });
    }

    const patientCase = await prisma.patientCase.findUnique({
      where: { id: caseId },
    });

    if (!patientCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (patientCase.status !== "IN_TREATMENT") {
      return res.status(400).json({ message: "Patient is not in treatment" });
    }

    // Calculate elapsed time since treatment started
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(patientCase.last_eval_time).getTime()) / 60000
    );

    // New total duration = remaining time + elapsed time
    const newTotalDuration = newDuration + elapsedMinutes;

    const updatedCase = await prisma.patientCase.update({
      where: { id: caseId },
      data: {
        treatment_duration: newTotalDuration,
      },
    });

    console.log(
      `Updated treatment duration for case ${caseId}: ${patientCase.treatment_duration} -> ${newTotalDuration} minutes (remaining: ${newDuration}m, elapsed: ${elapsedMinutes}m)`
    );

    return res.status(200).json({
      message: "Treatment duration updated successfully",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Error updating treatment duration:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const fillTreatmentSlots = async () => {
  try {
    const zones = ["RED", "ORANGE", "YELLOW", "GREEN"];

    for (const zone of zones) {
      const currentInTreatment = await prisma.patientCase.count({
        where: {
          zone: zone,
          status: "IN_TREATMENT",
        },
      });

      const availableSlots = TreatmentCapacity[zone] - currentInTreatment;

      if (availableSlots <= 0) {
        console.log(`No available slots in ${zone} zone`);
        continue;
      }

      console.log(`Filling ${availableSlots} available slots in ${zone} zone`);

      // Get top waiting cases for this zone, include disease to avoid N+1
      const topCases = await prisma.patientCase.findMany({
        where: {
          zone: zone,
          status: "WAITING",
        },
        orderBy: { priority: "desc" },
        take: availableSlots,
        include: { disease: true },
      });

      // Process each case
      for (const patientCase of topCases) {
        let treatmentDuration = 30;
        if (patientCase.disease && patientCase.disease.treatment_time) {
          treatmentDuration = patientCase.disease.treatment_time;
        }

        const treatmentStartTime = new Date();
        
        const updatedCase = await prisma.patientCase.update({
          where: { id: patientCase.id },
          data: {
            status: "IN_TREATMENT",
            treatment_duration: treatmentDuration,
            last_eval_time: treatmentStartTime,
          },
        });

        // Create log entry for automatic treatment start
        const patientData = await prisma.patient.findUnique({
          where: { id: updatedCase.patient_id }
        });
        
        // Current wait time = time from arrival to now (this gets FROZEN when entering treatment)
        const currentWaitTime = Math.floor(
          (treatmentStartTime.getTime() - updatedCase.arrival_time.getTime()) / 60000
        );
        const totalTimeInSystem = currentWaitTime;
        
        let maxWaitTime = disease?.max_wait_time ?? updatedCase.max_wait_time ?? null;
        if (typeof maxWaitTime === "string") maxWaitTime = parseFloat(maxWaitTime);
        if (isNaN(maxWaitTime)) maxWaitTime = null;
        
  const escalation = maxWaitTime !== null ? currentWaitTime > maxWaitTime : false;
        
        const vitalFields = extractVitalsForLogging(updatedCase.vitals || {});
        
        await createCaseLog({
          patientId: updatedCase.patient_id,
          caseId: updatedCase.id,
          zone: updatedCase.zone,
          diseaseCode: updatedCase.disease_code,
          priority: updatedCase.priority,
          age: updatedCase.age,
          sex: patientData.gender,
          SI: updatedCase.si,
          NEWS2: updatedCase.news2,
          ...vitalFields,
          resource_score: updatedCase.resource_score,
          max_wait_time: maxWaitTime,
          current_wait_time: currentWaitTime, // Frozen wait time
          total_time_in_system: totalTimeInSystem,
          escalation,
          treatment_time: 0, // Treatment just started, so treatment time is 0
          status: "IN_TREATMENT",
        });

        console.log(`Case ${patientCase.id} sent to treatment in ${zone} zone (logged)`);
      }
    }

    return { success: true, message: "Treatment slots filled successfully" };
  } catch (error) {
    console.error("Error filling treatment slots:", error);

    return { success: false, message: error.message };
  }
};

export const getTreatmentQueueStatus = async (req, res) => {
  try {
    const zones = ["RED", "ORANGE", "YELLOW", "GREEN"];
    const queueStatus = {};

    for (const zone of zones) {
      const currentInTreatment = await prisma.patientCase.count({
        where: {
          zone: zone,
          status: "IN_TREATMENT",
        },
      });

      queueStatus[zone] = {
        currentInTreatment,
        maxCapacity: TreatmentCapacity[zone],
        availableSlots: TreatmentCapacity[zone] - currentInTreatment,
        isAtCapacity: currentInTreatment >= TreatmentCapacity[zone],
      };
    }

    return res.status(200).json({
      message: "Treatment queue status fetched successfully",
      data: queueStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getWaitingQueueStatus = async (req, res) => {
  try {
    const zones = ["RED", "ORANGE", "YELLOW", "GREEN"];
    const queueStatus = {};

    for (const zone of zones) {
      const waitingCount = await prisma.patientCase.count({
        where: {
          zone: zone,
          status: "WAITING",
        },
      });

      queueStatus[zone] = {
        waitingCount,
      };
    }

    return res.status(200).json({
      message: "Waiting queue status fetched successfully",
      data: queueStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const recalculateAllPriorities = async () => {
  try {
    console.log("Starting priority recalculation...");

    const waitingCases = await prisma.patientCase.findMany({
      where: { status: "WAITING" },
    });

    const currentTime = new Date();

    for (const patientCase of waitingCases) {
      const waitingMinutes = Math.floor(
        (currentTime.getTime() - patientCase.arrival_time.getTime()) / 60000
      );

      const newPriority = calculatePriorityScore(
        patientCase.zone,
        patientCase.news2,
        patientCase.si,
        waitingMinutes,  // FIX: Added missing waitingMinutes parameter
        patientCase.resource_score,
        patientCase.age
      );

      await prisma.patientCase.update({
        where: { id: patientCase.id },
        data: {
          priority: newPriority,
          last_eval_time: currentTime,
        },
      });

      // Create periodic recalculation log entry
      const patientData = await prisma.patient.findUnique({
        where: { id: patientCase.patient_id }
      });
      
      const totalTimeInSystem = Math.floor(
        (currentTime.getTime() - patientCase.arrival_time.getTime()) / 60000
      );
      
      // Get max_wait_time from disease or case
      const diseaseData = patientCase.disease_code 
        ? await prisma.disease.findUnique({ where: { code: patientCase.disease_code } })
        : null;
  let maxWaitTime = diseaseData?.max_wait_time ?? patientCase.max_wait_time ?? null;
  if (typeof maxWaitTime === "string") maxWaitTime = parseFloat(maxWaitTime);
  if (isNaN(maxWaitTime)) maxWaitTime = null;
  const escalation = maxWaitTime !== null ? waitingMinutes > maxWaitTime : false;
      
      const vitalFields = extractVitalsForLogging(patientCase.vitals || {});
      
      await createCaseLog({
        patientId: patientCase.patient_id,
        caseId: patientCase.id,
        zone: patientCase.zone,
        diseaseCode: patientCase.disease_code,
        priority: newPriority,
        age: patientCase.age,
        sex: patientData.gender,
        SI: patientCase.si,
        NEWS2: patientCase.news2,
        ...vitalFields,
        resource_score: patientCase.resource_score,
        max_wait_time: maxWaitTime,
        current_wait_time: waitingMinutes,
        total_time_in_system: totalTimeInSystem,
        escalation,
        treatment_time: null, // Still waiting
        status: "Waiting",
      });
    }

    console.log(`Recalculated priorities for ${waitingCases.length} cases`);
  } catch (error) {
    console.error("Error recalculating priorities:", error);
  }
};

const refreshData = async () => {
  autoDischargeCompletedTreatments();
  recalculateAllPriorities();
  fillTreatmentSlots();
};

export const startPriorityScheduler = () => {
  const minutes = 1;
  cron.schedule(`*/${minutes} * * * *`, () => {
    console.log("Running scheduled priority recalculation...");
    refreshData();
  });

  console.log(`Priority & auto-discharge scheduler started - will run every ${minutes} minutes`);
};

export const triggerFillTreatmentSlots = async (req, res) => {
  try {
    const result = await fillTreatmentSlots();
    if (result.success) {
      return res.status(200).json({ message: result.message });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error triggering fill treatment slots:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const autoDischargeCompletedTreatments = async () => {
  try {
    console.log("Starting auto-discharge of completed treatments...");
    const inTreatmentCases = await prisma.patientCase.findMany({
      where: {
        status: "IN_TREATMENT",
        treatment_duration: { not: null },
      },
    });

    const currentTime = new Date();
    let discharged = 0;

    for (const patientCase of inTreatmentCases) {
      const treatmentStartTime = patientCase.last_eval_time;
      const treatmentDuration = patientCase.treatment_duration ?? 0;
      const treatmentEndTime = new Date(
        treatmentStartTime.getTime() + treatmentDuration * 60000 // Convert minutes to milliseconds
      );

      // If treatment time has passed or duration is zero/negative, auto-discharge
      if (treatmentDuration <= 0 || currentTime >= treatmentEndTime) {
        const updatedCase = await prisma.patientCase.update({
          where: { id: patientCase.id },
          data: {
            status: "DISCHARGED",
            time_served: currentTime,
            last_eval_time: currentTime,
          },
        });

        // Create discharge log entry
        const patientData = await prisma.patient.findUnique({
          where: { id: updatedCase.patient_id }
        });
        
        // Get the last IN_TREATMENT log to retrieve the frozen current_wait_time
        const lastTreatmentLog = await prisma.caseLog.findFirst({
          where: { 
            case_id: updatedCase.id,
            status: "IN_TREATMENT"
          },
          orderBy: { timestamp: "desc" }
        });
        
        const totalTimeInSystem = Math.floor(
          (currentTime.getTime() - updatedCase.arrival_time.getTime()) / 60000
        );
        
        // Use frozen wait time from when patient entered treatment
        const currentWaitTime = lastTreatmentLog?.current_wait_time ?? totalTimeInSystem;
        
        // Calculate treatment time: total time - wait time
        const treatmentTime = totalTimeInSystem - currentWaitTime;
        
        const diseaseData = updatedCase.disease_code 
          ? await prisma.disease.findUnique({ where: { code: updatedCase.disease_code } })
          : null;
        let maxWaitTime = diseaseData?.max_wait_time ?? updatedCase.max_wait_time ?? null;
        if (typeof maxWaitTime === "string") maxWaitTime = parseFloat(maxWaitTime);
        if (isNaN(maxWaitTime)) maxWaitTime = null;
        
  const escalation = maxWaitTime !== null ? currentWaitTime > maxWaitTime : false;
        
        const vitalFields = extractVitalsForLogging(updatedCase.vitals || {});
        
        await createCaseLog({
          patientId: updatedCase.patient_id,
          caseId: updatedCase.id,
          zone: updatedCase.zone,
          diseaseCode: updatedCase.disease_code,
          priority: updatedCase.priority,
          age: updatedCase.age,
          sex: patientData.gender,
          SI: updatedCase.si,
          NEWS2: updatedCase.news2,
          ...vitalFields,
          resource_score: updatedCase.resource_score,
          max_wait_time: maxWaitTime,
          current_wait_time: currentWaitTime,
          total_time_in_system: totalTimeInSystem,
          escalation,
          treatment_time: treatmentTime,
          status: "DISCHARGED",
        });

        console.log(
          `Auto-discharged patient ${patientCase.id} after ${treatmentDuration} minutes of treatment (logged)`
        );
        discharged++;
      }
    }

    if (discharged > 0) {
      console.log(`Auto-discharged ${discharged} patients`);
      // Fill newly available treatment slots
      await fillTreatmentSlots();
    }

    return { success: true, discharged };
  } catch (error) {
    console.error("Error in auto-discharge:", error);
    return { success: false, error: error.message };
  }
};

export const triggerAutoDischarge = async (req, res) => {
  try {
    const result = await autoDischargeCompletedTreatments();
    return res.status(200).json({
      message: `Auto-discharge completed. ${result.discharged} patients discharged.`,
      data: result,
    });
  } catch (error) {
    console.error("Error triggering auto-discharge:", error);
    return res.status(500).json({ message: error.message });
  }
};
