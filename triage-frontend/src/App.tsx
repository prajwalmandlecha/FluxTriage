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
    if (!waitingQueues || !treatmentQueues)
      return { waiting: 0, treatment: 0, total: 0 };

    const waiting = Object.values(waitingQueues.data).reduce(
      (sum, zone) => sum + zone.count,
      0
    );
    const treatment = Object.values(treatmentQueues.data).reduce(
      (sum, zone) => sum + zone.count,
      0
    );

    return { waiting, treatment, total: waiting + treatment };
  };

  const {
    waiting: totalWaiting,
    treatment: totalTreatment,
    total: totalPatients,
  } = getTotalCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b border-blue-800">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Hospital Triage System
                  </h1>
                  <p className="text-sm text-blue-100">
                    Real-time patient queue management
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden lg:flex items-center space-x-8 ml-12">
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-300" />
                  <div>
                    <p className="text-xs text-blue-100">Waiting</p>
                    <p className="text-lg font-bold text-white">
                      {totalWaiting}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg">
                  <Activity className="w-6 h-6 text-green-300" />
                  <div>
                    <p className="text-xs text-blue-100">In Treatment</p>
                    <p className="text-lg font-bold text-white">
                      {totalTreatment}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg">
                  <Users className="w-6 h-6 text-purple-300" />
                  <div>
                    <p className="text-xs text-blue-100">Total Patients</p>
                    <p className="text-lg font-bold text-white">
                      {totalPatients}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg
                  ${
                    autoRefresh
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
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
                className="flex items-center space-x-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Patient</span>
              </button>

              <button
                onClick={() => setShowCreateCase(true)}
                disabled={patients.length === 0}
                className="flex items-center space-x-2 px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="hidden sm:inline">New Case</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 pt-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-4 items-center bg-white p-6 rounded-xl shadow-md">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Now</span>
          </button>

          <button
            onClick={handleFillSlots}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Settings className="w-4 h-4" />
            <span>Fill Treatment Slots</span>
          </button>

          <button
            onClick={handleAutoDischarge}
            className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-sm hover:shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Auto Discharge</span>
          </button>

          <div className="ml-auto text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <span className="font-medium">Last updated:</span>{" "}
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {loading && !waitingQueues && !treatmentQueues ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-md">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
            <span className="ml-4 text-lg text-gray-700 font-medium">
              Loading triage data...
            </span>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Waiting Queues */}
            <section>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <Clock className="w-8 h-8 mr-4" />
                  Waiting Queues
                  <span className="ml-4 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-xl">
                    {totalWaiting} patients
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
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
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <Activity className="w-8 h-8 mr-4" />
                  Treatment Queues
                  <span className="ml-4 bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-xl">
                    {totalTreatment} patients
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6">
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
