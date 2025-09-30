import prisma from "../lib/prisma.js";

// Get all diseases
export const getAllDiseases = async (req, res) => {
  try {
    const { severity, search } = req.query;

    const where = {};

    if (severity) {
      where.severity = parseInt(severity);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const diseases = await prisma.disease.findMany({
      where,
      orderBy: [{ severity: "asc" }, { max_wait_time: "asc" }],
    });

    res.json({
      message: "Diseases retrieved successfully",
      data: diseases,
      count: diseases.length,
    });
  } catch (error) {
    console.error("Error fetching diseases:", error);
    res.status(500).json({
      error: "Failed to fetch diseases",
      details: error.message,
    });
  }
};

// Get disease by code
export const getDiseaseByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const disease = await prisma.disease.findUnique({
      where: { code },
      include: {
        patientCases: {
          where: {
            status: { in: ["WAITING", "IN_TREATMENT"] },
          },
          include: {
            patient: true,
          },
        },
      },
    });

    if (!disease) {
      return res.status(404).json({
        error: "Disease not found",
      });
    }

    res.json({
      message: "Disease retrieved successfully",
      data: disease,
      activeCases: disease.patientCases.length,
    });
  } catch (error) {
    console.error("Error fetching disease:", error);
    res.status(500).json({
      error: "Failed to fetch disease",
      details: error.message,
    });
  }
};

// Get diseases by category (using ICD-10 code prefix)
export const getDiseasesByCategory = async (req, res) => {
  try {
    const { prefix } = req.params;

    const diseases = await prisma.disease.findMany({
      where: {
        code: {
          startsWith: prefix.toUpperCase(),
        },
      },
      orderBy: [{ severity: "asc" }, { name: "asc" }],
    });

    res.json({
      message: `Diseases in category ${prefix} retrieved successfully`,
      data: diseases,
      count: diseases.length,
    });
  } catch (error) {
    console.error("Error fetching diseases by category:", error);
    res.status(500).json({
      error: "Failed to fetch diseases",
      details: error.message,
    });
  }
};

// Get disease statistics
export const getDiseaseStats = async (req, res) => {
  try {
    const stats = await prisma.disease.groupBy({
      by: ["severity"],
      _count: {
        id: true,
      },
      _avg: {
        treatment_time: true,
        max_wait_time: true,
      },
    });

    const formattedStats = stats.map((s) => ({
      severity: s.severity,
      count: s._count.id,
      avgTreatmentTime: Math.round(s._avg.treatment_time),
      avgMaxWait: Math.round(s._avg.max_wait_time),
    }));

    res.json({
      message: "Disease statistics retrieved successfully",
      data: formattedStats,
    });
  } catch (error) {
    console.error("Error fetching disease statistics:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message,
    });
  }
};
