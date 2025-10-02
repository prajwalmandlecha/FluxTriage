import prisma from "../lib/prisma.js";
import cron from "node-cron";
import { calculateNEWS2, validateVitals } from "../lib/news2.js";
import {
  createCaseLog,
  appendCaseUpdate,
  ensureCaseLogForCase,
  markTreatmentTimes,
  setOutcomeAndTotals,
} from "../lib/logging.js";

//assign zone based on NEWS2 and SI
const assignZone = (news2, si) => {
  if (news2 >= 7 || si === 4) return "RED";
  if (news2 >= 5 || si === 3) return "ORANGE";
  if (news2 >= 3 || si === 2) return "YELLOW";
  return "GREEN";
};

//zone weights
const Zones = {
  RED: { wNEWS2: 0.4, wSI: 0.3, wT: 0.0, wR: 0.2, wA: 0.1 },
  ORANGE: { wNEWS2: 0.35, wSI: 0.25, wT: 0.05, wR: 0.25, wA: 0.1 },
  YELLOW: { wNEWS2: 0.25, wSI: 0.2, wT: 0.15, wR: 0.3, wA: 0.1 },
  GREEN: { wNEWS2: 0.1, wSI: 0.1, wT: 0.3, wR: 0.2, wA: 0.3 },
};

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

    // Create initial log + update
    const caseLog = await createCaseLog({
      caseId: newCase.id,
      patientId: id,
      zone,
      age: ageInt,
      ageFactor,
      arrivalTime: arrival,
      diseaseCode: disease_code,
    });
    await appendCaseUpdate({
      caseLogId: caseLog.id,
      vitals,
      news2: computedNews2,
      si,
      resourceScore,
      priority,
      waitingMinutes: 0,
      rankInQueue: null,
      status: "WAITING",
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
        include: { patient: true, disease: true },
      });

      const now = new Date();
      //calculate times
      const cases = rawCases.map((c) => {
        const minutesWaited = Math.floor(
          (now.getTime() - new Date(c.arrival_time).getTime()) / 60000
        );
        const maxWait = c.disease?.max_wait_time ?? null;
        const exceeded = maxWait != null ? minutesWaited > maxWait : false;
        const overdueBy =
          exceeded && maxWait != null ? minutesWaited - maxWait : 0;

        const { disease, ...rest } = c;
        return {
          ...rest,
          minutes_waited: minutesWaited,
          exceeded_wait: exceeded,
          overdue_by_minutes: overdueBy,
          max_wait_time_resolved: maxWait,
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
        include: { patient: true },
      });

      //minutes remaining
      const now = new Date();
      const cases = rawCases
        .map((c) => {
          const startedAt = new Date(c.last_eval_time);
          const elapsedMinutes = Math.max(
            0,
            Math.floor((now.getTime() - startedAt.getTime()) / 60000)
          );
          const totalDuration = c.treatment_duration || 0;
          const remaining = Math.max(0, totalDuration - elapsedMinutes);
          return {
            ...c,
            remaining_treatment_minutes: remaining,
          };
        })
        .sort(
          (a, b) =>
            (a.remaining_treatment_minutes || 0) -
            (b.remaining_treatment_minutes || 0)
        );

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

    // Log treatment start
    const caseLog = await ensureCaseLogForCase({
      caseId: updatedCase.id,
      patientId: updatedCase.patient_id,
      zone: updatedCase.zone,
      age: updatedCase.age,
      ageFactor: updatedCase.age >= 65 || updatedCase.age <= 15 ? 1 : 0,
      arrivalTime: updatedCase.arrival_time,
      diseaseCode: updatedCase.disease_code,
    });
    await markTreatmentTimes({
      caseId: updatedCase.id,
      startTime: updatedCase.last_eval_time,
    });
    const waitingMinutes = Math.floor(
      (updatedCase.last_eval_time.getTime() -
        updatedCase.arrival_time.getTime()) /
        60000
    );
    await appendCaseUpdate({
      caseLogId: caseLog.id,
      vitals: updatedCase.vitals || {},
      news2: updatedCase.news2,
      si: updatedCase.si,
      resourceScore: updatedCase.resource_score,
      priority: updatedCase.priority,
      waitingMinutes,
      rankInQueue: null,
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

    // Log treatment end and outcome
    await markTreatmentTimes({
      caseId: updatedCase.id,
      endTime: updatedCase.last_eval_time,
    });
    const totalMinutes = Math.floor(
      (updatedCase.last_eval_time.getTime() -
        updatedCase.arrival_time.getTime()) /
        60000
    );
    await setOutcomeAndTotals({
      caseId: updatedCase.id,
      outcome: "discharged",
      totalTimeInMinutes: totalMinutes,
    });

    // Append final DISCHARGED update with total time in system
    const caseLog = await ensureCaseLogForCase({
      caseId: updatedCase.id,
      patientId: updatedCase.patient_id,
      zone: updatedCase.zone,
      age: updatedCase.age,
      ageFactor: updatedCase.age >= 65 || updatedCase.age <= 15 ? 1 : 0,
      arrivalTime: updatedCase.arrival_time,
      diseaseCode: updatedCase.disease_code,
    });
    const waitingMinutes = Math.max(
      0,
      Math.floor(
        ((updatedCase.time_served || updatedCase.last_eval_time).getTime() -
          updatedCase.arrival_time.getTime()) /
          60000
      )
    );
    await appendCaseUpdate({
      caseLogId: caseLog.id,
      vitals: updatedCase.vitals || {},
      news2: updatedCase.news2,
      si: updatedCase.si,
      resourceScore: updatedCase.resource_score,
      priority: updatedCase.priority,
      waitingMinutes,
      rankInQueue: null,
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

        const updatedCase = await prisma.patientCase.update({
          where: { id: patientCase.id },
          data: {
            status: "IN_TREATMENT",
            treatment_duration: treatmentDuration,
            last_eval_time: new Date(),
          },
        });

        console.log(`Case ${patientCase.id} sent to treatment in ${zone} zone`);

        // Logging: ensure log and mark treatment start + append update
        const caseLog = await ensureCaseLogForCase({
          caseId: updatedCase.id,
          patientId: updatedCase.patient_id,
          zone: updatedCase.zone,
          age: updatedCase.age,
          ageFactor: updatedCase.age >= 65 || updatedCase.age <= 15 ? 1 : 0,
          arrivalTime: updatedCase.arrival_time,
          diseaseCode: updatedCase.disease_code,
        });
        await markTreatmentTimes({
          caseId: updatedCase.id,
          startTime: updatedCase.last_eval_time,
        });
        const waitingMinutes = Math.floor(
          (updatedCase.last_eval_time.getTime() -
            updatedCase.arrival_time.getTime()) /
            60000
        );
        await appendCaseUpdate({
          caseLogId: caseLog.id,
          vitals: updatedCase.vitals || {},
          news2: updatedCase.news2,
          si: updatedCase.si,
          resourceScore: updatedCase.resource_score,
          priority: updatedCase.priority,
          waitingMinutes,
          rankInQueue: null,
          status: "IN_TREATMENT",
        });
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

      // Append periodic update log
      const caseLog = await ensureCaseLogForCase({
        caseId: patientCase.id,
        patientId: patientCase.patient_id,
        zone: patientCase.zone,
        age: patientCase.age,
        ageFactor,
        arrivalTime: patientCase.arrival_time,
        diseaseCode: patientCase.disease_code,
      });
      const waitingMinutes = Math.floor(
        (currentTime.getTime() - patientCase.arrival_time.getTime()) / 60000
      );
      // Rank in queue is complex; optionally null for now
      await appendCaseUpdate({
        caseLogId: caseLog.id,
        vitals: patientCase.vitals || {},
        news2: patientCase.news2,
        si: patientCase.si,
        resourceScore: patientCase.resource_score,
        priority: newPriority,
        waitingMinutes,
        rankInQueue: null,
        status: patientCase.status,
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
  const minutes = 5;
  cron.schedule(`*/${minutes} * * * *`, () => {
    console.log("Running scheduled priority recalculation...");
    refreshData();
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
