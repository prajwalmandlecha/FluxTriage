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
      className={`p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full ${config.badgeColor} flex items-center justify-center`}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className={`font-semibold ${config.textColor}`}>
              {patientCase.patient.name}
            </h4>
            <p className="text-sm text-gray-600">
              {patientCase.patient.age}y, {patientCase.patient.gender}
            </p>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${config.badgeColor} text-white`}
        >
          Priority: {patientCase.priority.toFixed(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">NEWS2:</span>
          <span className={`ml-1 ${config.textColor}`}>
            {patientCase.news2}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700">SI:</span>
          <span className={`ml-1 ${config.textColor}`}>{patientCase.si}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Resource:</span>
          <span className={`ml-1 ${config.textColor}`}>
            {patientCase.resource_score}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Status:</span>
          <span className={`ml-1 ${config.textColor}`}>
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
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors
            ${config.badgeColor} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          Send to Treatment
        </button>
      )}

      {type === "treatment" && onDischarge && (
        <button
          onClick={() => onDischarge(patientCase.id)}
          className="w-full py-2 px-4 rounded-md bg-gray-600 text-white font-medium hover:bg-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
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
      className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden shadow-sm`}
    >
      {/* Header */}
      <div className={`p-6 ${config.badgeColor} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">{zone} ZONE</h3>
              <p className="text-sm opacity-90">{config.label}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{data.count}</div>
            <div className="text-sm opacity-90">
              {type === "waiting" ? "Waiting" : "In Treatment"}
            </div>
          </div>
        </div>

        {type === "treatment" && data.capacity && (
          <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Capacity</span>
              <span>
                {data.count}/{data.capacity}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(data.count / data.capacity) * 100}%` }}
              />
            </div>
            <div className="text-xs mt-1 opacity-90">
              {data.available} slots available
            </div>
          </div>
        )}
      </div>

      {/* Cases List */}
      <div className="p-6">
        {data.cases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <IconComponent className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No patients in {type === "waiting" ? "queue" : "treatment"}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
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
