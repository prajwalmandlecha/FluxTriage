import { Router } from "express";
import {
  createCase,
  getTreatmentQueues,
  getWaitingQueues,
  sendToTreatment,
  dischargePatient,
  triggerFillTreatmentSlots,
  getTreatmentQueueStatus,
} from "../controllers/triageController.js";

const router = Router();

router.post("/cases", createCase);
router.get("/queues/waiting", getWaitingQueues);
router.get("/queues/treatment", getTreatmentQueues);
router.post("/treatment", sendToTreatment);
router.post("/discharge", dischargePatient);
router.post("/treatment/fill", triggerFillTreatmentSlots);

export default router;
