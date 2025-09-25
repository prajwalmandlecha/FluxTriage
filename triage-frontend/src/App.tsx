import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  Plus,
  RefreshCw,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import ZoneCard from "./components/ZoneCard";
import CreatePatientModal from "./components/CreatePatientModal";
import CreateCaseModal from "./components/CreateCaseModal";
import { triageApi } from "./services/api";
import {
  QueuesResponse,
  Patient,
  CreatePatientData,
  CreateCaseData,
} from "./types";

function App() {
  const [waitingQueues, setWaitingQueues] = useState<QueuesResponse | null>(
    null
  );
  const [treatmentQueues, setTreatmentQueues] = useState<QueuesResponse | null>(
    null
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [createPatientLoading, setCreatePatientLoading] = useState(false);
  const [createCaseLoading, setCreateCaseLoading] = useState(false);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [waitingRes, treatmentRes, patientsRes] = await Promise.all([
        triageApi.getWaitingQueues(),
        triageApi.getTreatmentQueues(),
        triageApi.getPatients(),
      ]);

      setWaitingQueues(waitingRes.data);
      setTreatmentQueues(treatmentRes.data);
      setPatients(patientsRes.data.data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Create patient
  const handleCreatePatient = async (data: CreatePatientData) => {
    try {
      setCreatePatientLoading(true);
      await triageApi.createPatient(data);
      setShowCreatePatient(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create patient");
    } finally {
      setCreatePatientLoading(false);
    }
  };

  // Create case
  const handleCreateCase = async (data: CreateCaseData) => {
    try {
      setCreateCaseLoading(true);
      await triageApi.createCase(data);
      setShowCreateCase(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create case");
    } finally {
      setCreateCaseLoading(false);
    }
  };

  // Send to treatment
  const handleSendToTreatment = async (caseId: string) => {
    try {
      await triageApi.sendToTreatment(caseId);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send to treatment");
    }
  };

  // Discharge patient
  const handleDischarge = async (caseId: string) => {
    try {
      await triageApi.dischargePatient(caseId);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to discharge patient");
    }
  };

  // Fill treatment slots
  const handleFillSlots = async () => {
    try {
      await triageApi.fillTreatmentSlots();
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fill treatment slots");
    }
  };

  // Auto discharge
  const handleAutoDischarge = async () => {
    try {
      await triageApi.autoDischarge();
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to auto-discharge patients"
      );
    }
  };

  const getTotalCounts = () => {
    if (!waitingQueues || !treatmentQueues) return { waiting: 0, treatment: 0 };

    const waiting = Object.values(waitingQueues.data).reduce(
      (sum, zone) => sum + zone.count,
      0
    );
    const treatment = Object.values(treatmentQueues.data).reduce(
      (sum, zone) => sum + zone.count,
      0
    );

    return { waiting, treatment };
  };

  const { waiting: totalWaiting, treatment: totalTreatment } = getTotalCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Hospital Triage System
                  </h1>
                  <p className="text-sm text-gray-600">
                    Real-time patient queue management
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center space-x-6 ml-8">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Waiting: {totalWaiting}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    In Treatment: {totalTreatment}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Patients: {patients.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    autoRefresh
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  Auto-refresh {autoRefresh ? "ON" : "OFF"}
                </span>
              </button>

              {/* Action buttons */}
              <button
                onClick={() => setShowCreatePatient(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Patient</span>
              </button>

              <button
                onClick={() => setShowCreateCase(true)}
                disabled={patients.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">New Case</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleFillSlots}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Fill Treatment Slots</span>
          </button>

          <button
            onClick={handleAutoDischarge}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Auto Discharge</span>
          </button>

          <div className="ml-auto text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {loading && !waitingQueues && !treatmentQueues ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading triage data...</span>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Waiting Queues */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-yellow-500" />
                Waiting Queues ({totalWaiting} patients)
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {waitingQueues &&
                  Object.entries(waitingQueues.data).map(([zone, data]) => (
                    <ZoneCard
                      key={zone}
                      zone={zone as any}
                      data={data}
                      type="waiting"
                      onSendToTreatment={handleSendToTreatment}
                    />
                  ))}
              </div>
            </section>

            {/* Treatment Queues */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-green-500" />
                Treatment Queues ({totalTreatment} patients)
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {treatmentQueues &&
                  Object.entries(treatmentQueues.data).map(([zone, data]) => (
                    <ZoneCard
                      key={zone}
                      zone={zone as any}
                      data={data}
                      type="treatment"
                      onDischarge={handleDischarge}
                    />
                  ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreatePatientModal
        isOpen={showCreatePatient}
        onClose={() => setShowCreatePatient(false)}
        onSubmit={handleCreatePatient}
        loading={createPatientLoading}
      />

      <CreateCaseModal
        isOpen={showCreateCase}
        onClose={() => setShowCreateCase(false)}
        onSubmit={handleCreateCase}
        patients={patients}
        loading={createCaseLoading}
      />
    </div>
  );
}

export default App;
