import prisma from "../lib/prisma.js";
import cron from "node-cron";
import { calculateNEWS2, validateVitals } from "../lib/news2.js";

const assignZone = (news2, si) => {
  if (news2 >= 7 || si === 4) return "RED";
  if (news2 >= 5 || si === 3) return "ORANGE";
  if (news2 >= 3 || si === 2) return "YELLOW";
  return "GREEN";
};

const Zones = {
  RED: { wNEWS2: 0.4, wSI: 0.3, wT: 0.0, wR: 0.2, wA: 0.1 },
  ORANGE: { wNEWS2: 0.35, wSI: 0.25, wT: 0.05, wR: 0.25, wA: 0.1 },
  YELLOW: { wNEWS2: 0.25, wSI: 0.2, wT: 0.15, wR: 0.3, wA: 0.1 },
  GREEN: { wNEWS2: 0.1, wSI: 0.1, wT: 0.3, wR: 0.2, wA: 0.3 },
};

const TreatmentCapacity = {
  RED: 5,
  ORANGE: 8,
  YELLOW: 10,
  GREEN: 15,
};

const checkZoneCapacity = async (zone) => {
  const currentInTreatment = await prisma.patientCase.count({
    where: {
      zone: zone,
      status: "IN_TREATMENT",
    },
  });

  return currentInTreatment < TreatmentCapacity[zone];
};

const calculatePriority = (
  zone,
  news2,
  si,
  resourceScore,
  ageFactor,
  arrivalTime
) => {
  const currentTime = new Date();
  const minutesWaited = Math.floor(
    (currentTime.getTime() - arrivalTime.getTime()) / 60000
  );
  const timeFactor = Math.min(4, Math.floor(minutesWaited));
  const { wNEWS2, wSI, wT, wR, wA } = Zones[zone];
  return (
    wNEWS2 * news2 +
    wSI * si +
    wT * timeFactor +
    wR * resourceScore +
    wA * ageFactor
  );
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
    const ageFactor = ageInt >= 65 || ageInt <= 15 ? 1 : 0;

    const priority = calculatePriority(
      zone,
      computedNews2,
      si,
      resourceScore,
      ageFactor,
      arrival
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

    await recalculateAllPriorities();

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
      const cases = await prisma.patientCase.findMany({
        where: { zone, status: "WAITING" },
        orderBy: { priority: "desc" },
        include: { patient: true },
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
      const cases = await prisma.patientCase.findMany({
        where: { zone, status: "IN_TREATMENT" },
        orderBy: { priority: "desc" },
        include: { patient: true },
      });

      treatmentQueues[zone] = {
        cases,
        count: cases.length,
        capacity: TreatmentCapacity[zone],
        available: TreatmentCapacity[zone] - cases.length,
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

      // Get top waiting cases for this zone
      const topCases = await prisma.patientCase.findMany({
        where: {
          zone: zone,
          status: "WAITING",
        },
        orderBy: { priority: "desc" },
        take: availableSlots,
      });

      // Process each case
      for (const patientCase of topCases) {
        const disease = await prisma.disease.findUnique({
          where: { code: patientCase.disease_code || "" },
        });

        let treatmentDuration = 30;
        if (disease && disease.treatment_time) {
          treatmentDuration = disease.treatment_time;
        }

        await prisma.patientCase.update({
          where: { id: patientCase.id },
          data: {
            status: "IN_TREATMENT",
            treatment_duration: treatmentDuration,
            last_eval_time: new Date(),
          },
        });

        console.log(`Case ${patientCase.id} sent to treatment in ${zone} zone`);
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
      const ageFactor = patientCase.age >= 65 || patientCase.age <= 15 ? 1 : 0;

      const newPriority = calculatePriority(
        patientCase.zone,
        patientCase.news2,
        patientCase.si,
        patientCase.resource_score,
        ageFactor,
        patientCase.arrival_time
      );

      await prisma.patientCase.update({
        where: { id: patientCase.id },
        data: {
          priority: newPriority,
          last_eval_time: currentTime,
        },
      });
    }

    console.log(`Recalculated priorities for ${waitingCases.length} cases`);
  } catch (error) {
    console.error("Error recalculating priorities:", error);
  }
};

export const startPriorityScheduler = () => {
  const minutes = 1;
  cron.schedule(`*/${minutes} * * * *`, () => {
    console.log("Running scheduled priority recalculation...");
    autoDischargeCompletedTreatments();
    recalculateAllPriorities();
    fillTreatmentSlots();
  });

  console.log(`Priority scheduler started - will run every ${minutes} minutes`);
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
      // When treatment started
      const treatmentEndTime = new Date(
        treatmentStartTime.getTime() + patientCase.treatment_duration * 60000 // Convert minutes to milliseconds
      );

      // If treatment time has passed, auto-discharge
      if (currentTime >= treatmentEndTime) {
        await prisma.patientCase.update({
          where: { id: patientCase.id },
          data: {
            status: "DISCHARGED",
            time_served: currentTime,
            last_eval_time: currentTime,
          },
        });

        console.log(
          `Auto-discharged patient ${patientCase.id} after ${patientCase.treatment_duration} minutes of treatment`
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
