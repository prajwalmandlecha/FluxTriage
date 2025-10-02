import { Router } from "express";
import {
  getPatients,
  getPatientById,
  createPatient,
  searchPatientByPhone,
  searchPatientByName,
  addPatientToED
} from "../controllers/patientController.js";

const router = Router();

router.get("/", getPatients);
router.get("/search", searchPatientByPhone);
router.get("/search-by-name", searchPatientByName);
router.get("/:id", getPatientById);
router.post("/", createPatient);
router.post("/add-to-ed", addPatientToED);

export default router;
