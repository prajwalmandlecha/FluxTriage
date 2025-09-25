import express from "express";
import triageRoutes from "./routes/triageRoutes.js";
import { startPriorityScheduler } from "./controllers/triageController.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

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
