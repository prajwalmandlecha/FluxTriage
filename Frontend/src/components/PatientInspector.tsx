import React from 'react';
import { Patient } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { 
  User, 
  Calendar, 
  Clock, 
  Heart, 
  Thermometer, 
  Activity, 
  Stethoscope,
  MapPin,
  X 
} from 'lucide-react';

interface PatientInspectorProps {
  patient: Patient | null;
  onClose: () => void;
}

export function PatientInspector({ patient, onClose }: PatientInspectorProps) {
  if (!patient) {
    return (
      <Card className="p-6 h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a patient to view details</p>
          </div>
        </div>
      </Card>
    );
  }

  const priorityColors = {
    Red: 'bg-red-100 text-red-800 border-red-300',
    Orange: 'bg-orange-100 text-orange-800 border-orange-300',
    Yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Green: 'bg-green-100 text-green-800 border-green-300'
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3>Patient Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Information
            </h4>
            <Badge className={priorityColors[patient.priority]}>
              {patient.priority} Priority
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span>{patient.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span>{patient.age} years</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Timing */}
        <div>
          <h4 className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            Timing Information
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrival Time:</span>
              <span>{formatTime(patient.arrivalTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waiting Time:</span>
              <span className="text-orange-600">{patient.waitingTime} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority Score:</span>
              <span>{patient.priorityScore}/4</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Vitals */}
        <div>
          <h4 className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" />
            Vital Signs
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            <Card className="p-3 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Heart Rate</span>
                </div>
                <span className="text-sm">{patient.vitals.heartRate} bpm</span>
              </div>
            </Card>
            
            <Card className="p-3 bg-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Temperature</span>
                </div>
                <span className="text-sm">{patient.vitals.temperature}°F</span>
              </div>
            </Card>
            
            <Card className="p-3 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Oxygen Sat</span>
                </div>
                <span className="text-sm">{patient.vitals.oxygenSat}%</span>
              </div>
            </Card>
            
            <Card className="p-3 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded text-white text-xs flex items-center justify-center">
                    BP
                  </div>
                  <span className="text-sm">Blood Pressure</span>
                </div>
                <span className="text-sm">{patient.vitals.bloodPressure}</span>
              </div>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Symptoms */}
        <div>
          <h4 className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-4 h-4" />
            Chief Complaint
          </h4>
          
          <Card className="p-3 bg-gray-50">
            <p className="text-sm">{patient.symptoms}</p>
          </Card>
        </div>

        <div className="pt-4">
          <Button className="w-full" variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            View Patient History
          </Button>
        </div>
      </div>
    </Card>
  );
}