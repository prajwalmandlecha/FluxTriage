import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  AlertCircle,
  Users,
  TrendingUp,
  Thermometer,
  Heart,
  Wind,
  Droplet,
  FileText,
  Search,
} from "lucide-react";
import { CreateCaseData, Patient, Disease } from "../types";
import { triageApi } from "../services/api";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCaseData) => void;
  patients: Patient[];
  loading?: boolean;
}

const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patients,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateCaseData>({
    id: "",
    si: 1,
    resourceScore: 1.0,
    age: 0,
    vitals: {
      respiratory_rate: 16,
      oxygen_saturation: 98,
      supplemental_oxygen: false,
      temperature: 37.0,
      systolic_bp: 120,
      heart_rate: 75,
      consciousness_level: "ALERT",
    },
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [predictedZone, setPredictedZone] = useState<string>("");
  const [calculatedNEWS2, setCalculatedNEWS2] = useState<number>(0);

  // Disease selection state
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [diseaseSearch, setDiseaseSearch] = useState<string>("");
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [showDiseaseDropdown, setShowDiseaseDropdown] =
    useState<boolean>(false);

  const calculateLocalNEWS2 = (vitals: CreateCaseData["vitals"]): number => {
    let score = 0;

    if (vitals.respiratory_rate <= 8) score += 3;
    else if (vitals.respiratory_rate <= 11) score += 1;
    else if (vitals.respiratory_rate <= 20) score += 0;
    else if (vitals.respiratory_rate <= 24) score += 2;
    else score += 3;

    if (vitals.supplemental_oxygen) {
      score += 2;
      if (vitals.oxygen_saturation <= 83) score += 3;
      else if (vitals.oxygen_saturation <= 85) score += 2;
      else if (vitals.oxygen_saturation <= 87) score += 1;
      else if (vitals.oxygen_saturation <= 92) score += 0;
      else if (vitals.oxygen_saturation <= 94) score += 1;
      else if (vitals.oxygen_saturation <= 96) score += 2;
      else score += 3;
    } else {
      if (vitals.oxygen_saturation <= 91) score += 3;
      else if (vitals.oxygen_saturation <= 93) score += 2;
      else if (vitals.oxygen_saturation <= 95) score += 1;
    }

    if (vitals.temperature <= 35.0) score += 3;
    else if (vitals.temperature <= 36.0) score += 1;
    else if (vitals.temperature <= 38.0) score += 0;
    else if (vitals.temperature <= 39.0) score += 1;
    else score += 2;

    if (vitals.systolic_bp <= 90) score += 3;
    else if (vitals.systolic_bp <= 100) score += 2;
    else if (vitals.systolic_bp <= 110) score += 1;
    else if (vitals.systolic_bp <= 219) score += 0;
    else score += 3;

    if (vitals.heart_rate <= 40) score += 3;
    else if (vitals.heart_rate <= 50) score += 1;
    else if (vitals.heart_rate <= 90) score += 0;
    else if (vitals.heart_rate <= 110) score += 1;
    else if (vitals.heart_rate <= 130) score += 2;
    else score += 3;

    if (vitals.consciousness_level !== "ALERT") score += 3;

    return Math.min(20, Math.max(0, score));
  };

  // Fetch diseases on component mount
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await triageApi.getDiseases();
        setDiseases(response.data.data);
      } catch (error) {
        console.error("Error fetching diseases:", error);
      }
    };
    fetchDiseases();
  }, []);

  // Filter diseases based on search
  const filteredDiseases = diseases.filter(
    (disease) =>
      disease.name.toLowerCase().includes(diseaseSearch.toLowerCase()) ||
      disease.code.toLowerCase().includes(diseaseSearch.toLowerCase()) ||
      (disease.description &&
        disease.description.toLowerCase().includes(diseaseSearch.toLowerCase()))
  );

  // Predict zone based on computed NEWS2 and SI
  useEffect(() => {
    const news2 = calculateLocalNEWS2(formData.vitals);
    setCalculatedNEWS2(news2);

    let zone = "GREEN";
    if (news2 >= 7 || formData.si === 4) zone = "RED";
    else if (news2 >= 5 || formData.si === 3) zone = "ORANGE";
    else if (news2 >= 3 || formData.si === 2) zone = "YELLOW";

    setPredictedZone(zone);
  }, [formData.vitals, formData.si]);

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setFormData({
        ...formData,
        id: patient.id,
        age: patient.age,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDiseaseSelect = (disease: Disease) => {
    setSelectedDisease(disease);
    setFormData({
      ...formData,
      disease_code: disease.code,
    });
    setDiseaseSearch(disease.name);
    setShowDiseaseDropdown(false);
  };

  const handleDiseaseSearchChange = (value: string) => {
    setDiseaseSearch(value);
    setShowDiseaseDropdown(true);
    if (!value) {
      setSelectedDisease(null);
      setFormData({
        ...formData,
        disease_code: undefined,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      id: "",
      si: 1,
      resourceScore: 1.0,
      age: 0,
      vitals: {
        respiratory_rate: 16,
        oxygen_saturation: 98,
        supplemental_oxygen: false,
        temperature: 37.0,
        systolic_bp: 120,
        heart_rate: 75,
        consciousness_level: "ALERT",
      },
    });
    setSelectedPatient(null);
    setSelectedDisease(null);
    setDiseaseSearch("");
    setShowDiseaseDropdown(false);
    onClose();
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "RED":
        return "text-red-600 bg-red-50 border-red-200";
      case "ORANGE":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "YELLOW":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Triage Case
              </h2>
              <p className="text-sm text-gray-600">
                Assess patient and assign to appropriate zone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Select Patient *
            </label>
            <select
              required
              value={formData.id}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.age}y, {patient.gender}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <strong>Selected:</strong> {selectedPatient.name} (
                  {selectedPatient.age}y, {selectedPatient.gender})
                  <br />
                  <strong>Phone:</strong> {selectedPatient.phone}
                  {selectedPatient.email && (
                    <>
                      <br />
                      <strong>Email:</strong> {selectedPatient.email}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vital Signs */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Activity className="w-5 h-5 inline mr-2" />
              Vital Signs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Respiratory Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wind className="w-4 h-4 inline mr-1" />
                  Respiratory Rate * (breaths/min)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={60}
                  value={formData.vitals.respiratory_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        respiratory_rate: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 16"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Normal: 12-20 breaths/min
                </p>
              </div>

              {/* Oxygen Saturation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplet className="w-4 h-4 inline mr-1" />
                  Oxygen Saturation * (SpO2 %)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={formData.vitals.oxygen_saturation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        oxygen_saturation: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 98"
                />
                <p className="text-xs text-gray-500 mt-1">Normal: ≥96%</p>
              </div>

              {/* Supplemental Oxygen */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.vitals.supplemental_oxygen}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vitals: {
                          ...formData.vitals,
                          supplemental_oxygen: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Patient is on supplemental oxygen
                  </span>
                </label>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer className="w-4 h-4 inline mr-1" />
                  Temperature * (°C)
                </label>
                <input
                  type="number"
                  required
                  min={30}
                  max={45}
                  step={0.1}
                  value={formData.vitals.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        temperature: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 37.0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Normal: 36.1-38.0°C
                </p>
              </div>

              {/* Systolic Blood Pressure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Systolic BP * (mmHg)
                </label>
                <input
                  type="number"
                  required
                  min={40}
                  max={300}
                  value={formData.vitals.systolic_bp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        systolic_bp: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 120"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Normal: 111-219 mmHg
                </p>
              </div>

              {/* Heart Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Heart Rate * (bpm)
                </label>
                <input
                  type="number"
                  required
                  min={20}
                  max={250}
                  value={formData.vitals.heart_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        heart_rate: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 75"
                />
                <p className="text-xs text-gray-500 mt-1">Normal: 51-90 bpm</p>
              </div>

              {/* Consciousness Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Consciousness Level * (AVPU)
                </label>
                <select
                  required
                  value={formData.vitals.consciousness_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        consciousness_level: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="ALERT">A - Alert</option>
                  <option value="VOICE">V - Responds to Voice</option>
                  <option value="PAIN">P - Responds to Pain</option>
                  <option value="UNRESPONSIVE">U - Unresponsive</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  AVPU scale assessment
                </p>
              </div>
            </div>
          </div>

          {/* Disease/Condition Selection */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <FileText className="w-5 h-5 inline mr-2" />
              Condition/Diagnosis (Optional)
            </h3>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search Disease/Condition
              </label>
              <input
                type="text"
                value={diseaseSearch}
                onChange={(e) => handleDiseaseSearchChange(e.target.value)}
                onFocus={() => setShowDiseaseDropdown(true)}
                placeholder="Type to search by name or ICD-10 code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Disease Dropdown */}
              {showDiseaseDropdown && diseaseSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {filteredDiseases.length > 0 ? (
                    filteredDiseases.slice(0, 10).map((disease) => (
                      <button
                        key={disease.id}
                        type="button"
                        onClick={() => handleDiseaseSelect(disease)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {disease.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ICD-10: {disease.code}
                            </div>
                            {disease.description && (
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {disease.description}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex flex-col items-end text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                disease.severity === 1
                                  ? "bg-red-100 text-red-700"
                                  : disease.severity === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : disease.severity === 3
                                  ? "bg-yellow-100 text-yellow-700"
                                  : disease.severity === 4
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              Severity {disease.severity}
                            </span>
                            <span className="text-gray-500 mt-1">
                              ~{disease.treatment_time}min
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No diseases found matching "{diseaseSearch}"
                    </div>
                  )}
                </div>
              )}

              {/* Selected Disease Info */}
              {selectedDisease && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900">
                        {selectedDisease.name}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        ICD-10: {selectedDisease.code}
                      </div>
                      {selectedDisease.description && (
                        <div className="text-sm text-blue-800 mt-2">
                          {selectedDisease.description}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-blue-700">
                          <strong>Treatment Time:</strong>{" "}
                          {selectedDisease.treatment_time} minutes
                        </span>
                        <span className="text-blue-700">
                          <strong>Max Wait:</strong>{" "}
                          {selectedDisease.max_wait_time} minutes
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            selectedDisease.severity === 1
                              ? "bg-red-100 text-red-700"
                              : selectedDisease.severity === 2
                              ? "bg-orange-100 text-orange-700"
                              : selectedDisease.severity === 3
                              ? "bg-yellow-100 text-yellow-700"
                              : selectedDisease.severity === 4
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          Severity Level {selectedDisease.severity}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDisease(null);
                        setDiseaseSearch("");
                        setFormData({
                          ...formData,
                          disease_code: undefined,
                        });
                      }}
                      className="ml-3 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Assessment */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Clinical Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Index * (1-4)
                </label>
                <select
                  required
                  value={formData.si}
                  onChange={(e) =>
                    setFormData({ ...formData, si: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={1}>1 - Minimal</option>
                  <option value={2}>2 - Moderate</option>
                  <option value={3}>3 - Severe</option>
                  <option value={4}>4 - Critical</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Clinical severity assessment
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Resource Score * (0.5-5.0)
                </label>
                <input
                  type="number"
                  required
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={formData.resourceScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resourceScore: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Expected resource utilization"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expected resource utilization and complexity (0.5 = minimal,
                  5.0 = maximum)
                </p>
              </div>
            </div>
          </div>

          {/* Predicted Zone & NEWS2 Score */}
          {predictedZone && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Triage Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NEWS2 Score */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium">
                    NEWS2 (preview): {calculatedNEWS2}
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Computed from entered vitals; final score is calculated on
                    server
                  </p>
                </div>
                {/* Zone */}
                <div
                  className={`p-4 rounded-lg border-2 ${getZoneColor(
                    predictedZone
                  )}`}
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                      <h4 className="font-semibold">
                        Predicted Zone: {predictedZone}
                      </h4>
                      <p className="text-sm opacity-80">
                        Based on NEWS2 preview ({calculatedNEWS2}) and Severity
                        Index ({formData.si})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.id}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCaseModal;
