import prisma from "../lib/prisma.js";

export const getPatients = async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    res
      .status(200)
      .json({ message: "Patients fetched successfully", data: patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
    });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, email, medical_history } = req.body;
    const patient = await prisma.patient.create({
      data: { name, age: parseInt(age), gender, phone, email, medical_history },
    });
    res
      .status(201)
      .json({ message: "Patient created successfully", data: patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
