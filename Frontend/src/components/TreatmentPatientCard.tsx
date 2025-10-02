import React from 'react';
import { Patient } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Heart, Thermometer, Activity, AlertTriangle } from 'lucide-react';

interface TreatmentPatientCardProps {
  patient: Patient;
  remainingTime: number;
  arrivalTime: Date;
  waitedTime: number; // Time spent in waiting queue before treatment
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, patient: Patient) => void;
  onClick?: () => void;
  className?: string;
}

export function TreatmentPatientCard({ 
  patient, 
  remainingTime, 
  arrivalTime, 
  waitedTime,
  isDragging, 
  onDragStart, 
  onClick, 
  className = '' 
}: TreatmentPatientCardProps) {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card 
      className={`p-2 cursor-move transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${className}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, patient)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <h4 className="truncate text-sm">{patient.name}</h4>
          <p className="text-muted-foreground text-xs">ID: {patient.id} • {patient.age}y • {patient.gender}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
            {formatTime(remainingTime)}
          </Badge>
          <span className="text-xs text-muted-foreground">Remaining</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium truncate">{patient.diagnosis}</p>
        <p className="text-xs text-muted-foreground truncate">{patient.symptoms}</p>
        
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-500" />
            <span>{patient.vitals.pulse}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-500" />
            <span>{patient.vitals.oxygenSat.toFixed(2)}%{patient.vitals.oxygenSupport ? '*' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-500" />
            <span>{patient.vitals.temperature.toFixed(2)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 text-purple-500 flex items-center justify-center text-xs">BP</span>
            <span className="text-xs">{patient.vitals.systolicBP}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 text-indigo-500 flex items-center justify-center text-xs">RR</span>
            <span className="text-xs">{patient.vitals.respiratoryRate}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 text-pink-500 flex items-center justify-center text-xs">C</span>
            <span className="text-xs">{patient.vitals.consciousness}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Resource: {patient.resourceScore.toFixed(2)}</span>
            <span className="text-muted-foreground">Est. Time: {patient.estimatedTreatmentTime}m</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {patient.status === 'WAITING' ? (
                <span className="text-muted-foreground">Waited: {waitedTime}m</span>
              ) : patient.status === 'IN_TREATMENT' ? (
                <span className="text-green-600 font-medium">Treatment: {patient.treatmentTime}m</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <span className="text-muted-foreground">Arrived: {formatDate(arrivalTime)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}