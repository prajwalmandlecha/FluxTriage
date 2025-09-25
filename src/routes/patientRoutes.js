import { Router } from "express";
import {
  getPatients,
  getPatientById,
  createPatient,
} from "../controllers/patientController.js"; // Add missing imports

const router = Router();

router.get("/", getPatients);
router.get("/:id", getPatientById);
router.post("/", createPatient);

export default router;
