import express from "express";
import cors from "cors";
import triageRoutes from "./routes/triageRoutes.js";
import { startPriorityScheduler } from "./controllers/triageController.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => res.send("OK"));

app.use("/api/patients", patientRoutes);
app.use("/api/triage", triageRoutes);

startPriorityScheduler();

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`My first Express app - listening on port ${PORT}!`);
});
