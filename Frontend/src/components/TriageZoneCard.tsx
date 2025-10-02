import React from 'react';
import { TriageZone, Patient } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { PatientCard } from './PatientCard';
import { TreatmentBedCard } from './TreatmentBedCard';
import { Users, Bed } from 'lucide-react';

interface TriageZoneCardProps {
  zone: TriageZone;
  onDragStart: (e: React.DragEvent, patient: Patient) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, bedId: string) => void;
  onTimeAdjust: (bedId: string, newTime: number) => void;
  onDischarge: (bedId: string) => void;
}

export function TriageZoneCard({
  zone,
  onDragStart,
  onDragOver,
  onDrop,
  onTimeAdjust,
  onDischarge
}: TriageZoneCardProps) {
  const occupiedBeds = zone.treatmentQueue.filter(bed => bed.patient).length;

  return (
    <Card className={`p-4 h-full ${zone.bgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`${zone.color} flex items-center gap-2`}>
            <div className={`w-3 h-3 rounded-full ${zone.priority === 'Red' ? 'bg-red-500' : zone.priority === 'Orange' ? 'bg-orange-500' : zone.priority === 'Yellow' ? 'bg-yellow-500' : 'bg-green-500'}`} />
            {zone.name}
          </h3>
          <p className="text-sm text-muted-foreground">{zone.priority} Priority</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary">
            {occupiedBeds}/{zone.maxBeds} beds
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-5rem)]">
        {/* Waiting Queue */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <h4>Waiting Queue</h4>
            <Badge variant="outline">{zone.waitingQueue.length}</Badge>
          </div>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-2">
              {zone.waitingQueue.length > 0 ? (
                zone.waitingQueue.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onDragStart={onDragStart}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p className="text-sm">No patients waiting</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Treatment Queue */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4" />
            <h4>Treatment Beds</h4>
            <Badge variant="outline">{occupiedBeds}/{zone.maxBeds}</Badge>
          </div>
          
          <ScrollArea className="h-[400px]">
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
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}