import { Router } from "express";
import {
  createCase,
  getTreatmentQueues,
  getWaitingQueues,
  sendToTreatment,
  dischargePatient,
  triggerFillTreatmentSlots,
  getTreatmentQueueStatus,
  triggerAutoDischarge,
  getWaitingQueueStatus,
} from "../controllers/triageController.js";

const router = Router();

router.post("/cases", createCase);
router.get("/queues/waiting", getWaitingQueues);
router.get("/queues/treatment", getTreatmentQueues);
router.get("/queues/treatment/status", getTreatmentQueueStatus);
router.get("/queues/waiting/status", getWaitingQueueStatus);
router.post("/treatment", sendToTreatment);
router.post("/discharge", dischargePatient);
router.post("/discharge/allCompleted", triggerAutoDischarge);
router.post("/treatment/fill", triggerFillTreatmentSlots);

export default router;
