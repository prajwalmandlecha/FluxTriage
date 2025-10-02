import React from 'react';
import { TriageZone, Patient } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

import { PatientCard } from './PatientCard';
import { TreatmentBedCard } from './TreatmentBedCard';

import { Users, Bed, Activity, Clock, TrendingUp } from 'lucide-react';

interface ZonePageProps {
  zone: TriageZone;
  onDragStart: (e: React.DragEvent, patient: Patient) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, bedId: string) => void;
  onTimeAdjust: (bedId: string, newTime: number) => void;
  onDischarge: (bedId: string) => void;
}

export function ZonePage({
  zone,
  onDragStart,
  onDragOver,
  onDrop,
  onTimeAdjust,
  onDischarge
}: ZonePageProps) {
  const occupiedBeds = zone.treatmentQueue.filter(bed => bed.patient).length;
  const avgWaitTime = zone.waitingQueue.length > 0 
    ? Math.round(zone.waitingQueue.reduce((sum, p) => sum + p.waitingTime, 0) / zone.waitingQueue.length)
    : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        {/* Zone Header */}
        <div className={`rounded-lg p-6 mb-6 ${zone.bgColor}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                zone.priority === 'Red' ? 'bg-red-500' :
                zone.priority === 'Orange' ? 'bg-orange-500' :
                zone.priority === 'Yellow' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <h1 className={`text-3xl ${zone.color}`}>{zone.name} Zone</h1>
              <Badge className={`${
                zone.priority === 'Red' ? 'bg-red-100 text-red-800' :
                zone.priority === 'Orange' ? 'bg-orange-100 text-orange-800' :
                zone.priority === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {zone.priority} Priority
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-lg">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Zone Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-white/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                  <p className="text-2xl">{zone.waitingQueue.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/50">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">In Treatment</p>
                  <p className="text-2xl">{occupiedBeds}/{zone.maxBeds}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-2xl">{avgWaitTime}m</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-2xl">{Math.round((occupiedBeds / zone.maxBeds) * 100)}%</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Waiting Queue */}
          <Card className="p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h2>Waiting Queue</h2>
                <Badge variant="outline">{zone.waitingQueue.length} patients</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Priority ordered (highest first)
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 pr-2">
                {zone.waitingQueue.length > 0 ? (
                  zone.waitingQueue.map((patient, index) => (
                    <div key={patient.id} className="relative">
                      <Badge 
                        variant="outline" 
                        className="absolute -top-1 -left-1 z-10 bg-white text-xs h-5 px-1"
                      >
                        #{index + 1}
                      </Badge>
                      <PatientCard
                        patient={patient}
                        onDragStart={onDragStart}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No patients in waiting queue</p>
                      <p className="text-sm">Queue is empty</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Treatment Beds */}
          <Card className="p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                <h2>Treatment Beds</h2>
                <Badge variant="outline">{occupiedBeds}/{zone.maxBeds} occupied</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Time ordered (shortest first)
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 pr-2">
                {zone.treatmentQueue.map((bed) => (
                  <TreatmentBedCard
                    key={bed.id}
                    bed={bed}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onTimeAdjust={onTimeAdjust}
                    onDischarge={onDischarge}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}