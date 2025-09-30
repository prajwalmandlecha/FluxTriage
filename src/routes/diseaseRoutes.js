import express from "express";
import {
  getAllDiseases,
  getDiseaseByCode,
  getDiseasesByCategory,
  getDiseaseStats,
} from "../controllers/diseaseController.js";

const router = express.Router();

// Get all diseases (with optional filtering)
router.get("/", getAllDiseases);

// Get disease statistics
router.get("/stats", getDiseaseStats);

// Get disease by ICD-10 code
router.get("/:code", getDiseaseByCode);

// Get diseases by category (ICD-10 prefix)
router.get("/category/:prefix", getDiseasesByCategory);

export default router;
