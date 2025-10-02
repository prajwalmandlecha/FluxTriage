import React from 'react';
import { Patient } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, Heart, Thermometer, Activity, AlertTriangle } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, patient: Patient) => void;
  onClick?: () => void;
  className?: string;
}

export function PatientCard({ patient, isDragging, onDragStart, onClick, className = '' }: PatientCardProps) {
  // Display maxWaitingTime: 0 is valid (critical patients), null/undefined shows '-'
  const displayMaxWaitingTime = typeof patient.maxWaitingTime === 'number'
    ? patient.maxWaitingTime
    : '-';
  const isEscalated = typeof displayMaxWaitingTime === 'number' && patient.waitingTime > displayMaxWaitingTime;

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
          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
            {patient.priorityScore.toFixed(2)}
          </Badge>
          <span className="text-xs text-muted-foreground">Priority</span>
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
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {patient.status === 'WAITING' ? (
                <span className={isEscalated ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                  {patient.waitingTime}m / {displayMaxWaitingTime}m
                  {isEscalated ? <AlertTriangle className="w-3 h-3 text-red-500" /> : null}
                </span>
              ) : patient.status === 'IN_TREATMENT' ? (
                <span className="text-green-600 font-medium">
                  {patient.treatmentTime}m
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
              {/* Only show AlertTriangle if escalated */}
            </div>
            <span className="text-muted-foreground">Resource: {patient.resourceScore.toFixed(2)}</span>
          </div>
          {isEscalated && (
            <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>ESCALATION NEEDED</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>NEWS2: {patient.news2Score}</span>
            <span>Zone: {patient.priority}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}