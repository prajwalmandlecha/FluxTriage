import React, { useState } from "react";
import { X, User, Phone, Mail, Calendar } from "lucide-react";
import { CreatePatientData, Gender } from "../types";

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePatientData) => void;
  loading?: boolean;
}

const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePatientData>({
    name: "",
    age: "",
    gender: "MALE",
    phone: "",
    email: "",
    medical_history: {},
  });

  const [allergies, setAllergies] = useState<string>("");
  const [conditions, setConditions] = useState<string>("");
  const [medications, setMedications] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const medicalHistory = {
      allergies: allergies
        ? allergies
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : [],
      conditions: conditions
        ? conditions
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : [],
      medications: medications
        ? medications
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : [],
    };

    onSubmit({
      ...formData,
      medical_history: medicalHistory,
    });
  };

  const handleClose = () => {
    setFormData({
      name: "",
      age: "",
      gender: "MALE",
      phone: "",
      email: "",
      medical_history: {},
    });
    setAllergies("");
    setConditions("");
    setMedications("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create New Patient
              </h2>
              <p className="text-sm text-gray-600">
                Add patient information to the system
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter patient's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Age *
              </label>
              <input
                type="number"
                required
                min="0"
                max="150"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Age in years"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as Gender })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit phone number"
                pattern="[0-9]{10}"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="patient@example.com (optional)"
            />
          </div>

          {/* Medical History */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Medical History
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., penicillin, peanuts, latex (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions
                </label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., diabetes, hypertension, asthma (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., metformin, lisinopril, aspirin (comma-separated)"
                />
              </div>
            </div>
          </div>

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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePatientModal;
