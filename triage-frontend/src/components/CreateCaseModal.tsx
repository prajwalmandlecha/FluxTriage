import React, { useState, useEffect } from "react";
import { X, Activity, AlertCircle, Users, TrendingUp } from "lucide-react";
import { CreateCaseData, Patient } from "../types";

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
    news2: 0,
    si: 1,
    resourceScore: 1.0,
    age: 0,
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [predictedZone, setPredictedZone] = useState<string>("");

  // Predict zone based on NEWS2 and SI
  useEffect(() => {
    const { news2, si } = formData;
    let zone = "GREEN";

    if (news2 >= 7 || si === 4) zone = "RED";
    else if (news2 >= 5 || si === 3) zone = "ORANGE";
    else if (news2 >= 3 || si === 2) zone = "YELLOW";

    setPredictedZone(zone);
  }, [formData.news2, formData.si]);

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

  const handleClose = () => {
    setFormData({
      id: "",
      news2: 0,
      si: 1,
      resourceScore: 1.0,
      age: 0,
    });
    setSelectedPatient(null);
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

          {/* Clinical Assessment */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Clinical Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  NEWS2 Score * (0-20)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="20"
                  value={formData.news2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      news2: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="National Early Warning Score"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Physiological parameters assessment (0-20 scale)
                </p>
              </div>

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

          {/* Predicted Zone */}
          {predictedZone && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Triage Assessment
              </h3>
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
                      Based on NEWS2 ({formData.news2}) and Severity Index (
                      {formData.si})
                    </p>
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
