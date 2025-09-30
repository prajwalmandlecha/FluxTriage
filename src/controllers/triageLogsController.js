import { getCaseLogs } from "../lib/logging.js";

export const getLogsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    if (!caseId) return res.status(400).json({ message: "caseId is required" });

    const log = await getCaseLogs(caseId);
    if (!log)
      return res.status(404).json({ message: "Logs not found for case" });

    return res
      .status(200)
      .json({ message: "Logs fetched successfully", data: log });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({ message: error.message });
  }
};
