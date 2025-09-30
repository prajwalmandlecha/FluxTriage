import React from "react";
import { QueueData, Zone, PatientCase } from "../types";
import {
  Heart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  Activity,
} from "lucide-react";

interface ZoneCardProps {
  zone: Zone;
  data: QueueData;
  type: "waiting" | "treatment";
  onSendToTreatment?: (caseId: string) => void;
  onDischarge?: (caseId: string) => void;
}

const zoneConfig = {
  RED: {
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    badgeColor: "bg-red-500",
    icon: Heart,
    label: "Critical",
  },
  ORANGE: {
    color: "orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    badgeColor: "bg-orange-500",
    icon: AlertTriangle,
    label: "High Priority",
  },
  YELLOW: {
    color: "yellow",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    badgeColor: "bg-yellow-500",
    icon: Clock,
    label: "Medium Priority",
  },
  GREEN: {
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    badgeColor: "bg-green-500",
    icon: CheckCircle2,
    label: "Low Priority",
  },
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const hours = Math.floor(diffInMinutes / 60);
  if (hours < 24) return `${hours}h ${diffInMinutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const PatientCard: React.FC<{
  patientCase: PatientCase;
  zone: Zone;
  type: "waiting" | "treatment";
  onSendToTreatment?: (caseId: string) => void;
  onDischarge?: (caseId: string) => void;
}> = ({ patientCase, zone, type, onSendToTreatment, onDischarge }) => {
  const config = zoneConfig[zone];

  return (
    <div
      className={`p-5 rounded-xl border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-xl hover:scale-[1.02] shadow-md`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl ${config.badgeColor} flex items-center justify-center shadow-md`}
          >
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className={`font-bold text-base ${config.textColor}`}>
              {patientCase.patient.name}
            </h4>
            <p className="text-sm text-gray-600 font-medium">
              {patientCase.patient.age}y, {patientCase.patient.gender}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${config.badgeColor} text-white shadow-sm`}
        >
          Priority: {patientCase.priority.toFixed(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-white/50 p-2 rounded-lg">
          <span className="font-semibold text-gray-700 block text-xs mb-0.5">
            NEWS2:
          </span>
          <span className={`text-lg font-bold ${config.textColor}`}>
            {patientCase.news2}
          </span>
        </div>
        <div className="bg-white/50 p-2 rounded-lg">
          <span className="font-semibold text-gray-700 block text-xs mb-0.5">
            SI:
          </span>
          <span className={`text-lg font-bold ${config.textColor}`}>
            {patientCase.si}
          </span>
        </div>
        <div className="bg-white/50 p-2 rounded-lg">
          <span className="font-semibold text-gray-700 block text-xs mb-0.5">
            Resource:
          </span>
          <span className={`text-lg font-bold ${config.textColor}`}>
            {patientCase.resource_score}
          </span>
        </div>
        <div className="bg-white/50 p-2 rounded-lg">
          <span className="font-semibold text-gray-700 block text-xs mb-0.5">
            Status:
          </span>
          <span className={`text-xs font-bold ${config.textColor}`}>
            {patientCase.status}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>Arrived: {formatTimeAgo(patientCase.arrival_time)}</span>
        </div>
        {type === "treatment" && patientCase.treatment_duration && (
          <div className="flex items-center space-x-1">
            <Activity className="w-4 h-4" />
            <span>Treatment: {patientCase.treatment_duration}min</span>
          </div>
        )}
      </div>

      {type === "waiting" && onSendToTreatment && (
        <button
          onClick={() => onSendToTreatment(patientCase.id)}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-all shadow-md hover:shadow-lg
            ${config.badgeColor} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105`}
        >
          Send to Treatment
        </button>
      )}

      {type === "treatment" && onDischarge && (
        <button
          onClick={() => onDischarge(patientCase.id)}
          className="w-full py-3 px-4 rounded-lg bg-gray-600 text-white font-bold hover:bg-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
        >
          Discharge Patient
        </button>
      )}
    </div>
  );
};

const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  data,
  type,
  onSendToTreatment,
  onDischarge,
}) => {
  const config = zoneConfig[zone];
  const IconComponent = config.icon;

  return (
    <div
      className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]`}
    >
      {/* Header */}
      <div className={`p-6 ${config.badgeColor} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{zone} ZONE</h3>
              <p className="text-sm opacity-90 font-medium">{config.label}</p>
            </div>
          </div>
          <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-4xl font-bold">{data.count}</div>
            <div className="text-xs opacity-90 font-medium">
              {type === "waiting" ? "Waiting" : "In Treatment"}
            </div>
          </div>
        </div>

        {type === "treatment" && data.capacity && (
          <div className="mt-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2 font-semibold">
              <span>Capacity</span>
              <span className="text-lg font-bold">
                {data.count}/{data.capacity}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${(data.count / data.capacity) * 100}%` }}
              />
            </div>
            <div className="text-sm mt-2 opacity-90 font-medium">
              {data.available} slots available
            </div>
          </div>
        )}
      </div>

      {/* Cases List */}
      <div className="p-6">
        {data.cases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <IconComponent className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium">
              No patients in {type === "waiting" ? "queue" : "treatment"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.cases.map((patientCase) => (
              <PatientCard
                key={patientCase.id}
                patientCase={patientCase}
                zone={zone}
                type={type}
                onSendToTreatment={onSendToTreatment}
                onDischarge={onDischarge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneCard;
