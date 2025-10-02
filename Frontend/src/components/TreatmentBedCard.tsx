import React from 'react';
import { TreatmentBed } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Clock, User, X } from 'lucide-react';
import { TreatmentPatientCard } from './TreatmentPatientCard';

interface TreatmentBedCardProps {
  bed: TreatmentBed;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, bedId: string) => void;
  onTimeAdjust?: (bedId: string, newTime: number) => void;
  onDischarge?: (bedId: string) => void;
  className?: string;
}

export function TreatmentBedCard({ 
  bed, 
  onDragOver, 
  onDrop, 
  onTimeAdjust,
  onDischarge,
  className = '' 
}: TreatmentBedCardProps) {
  const [timeInput, setTimeInput] = React.useState(bed.remainingTime.toString());
  const [showTimeEdit, setShowTimeEdit] = React.useState(false);

  const handleTimeSubmit = () => {
    const newTime = parseInt(timeInput);
    if (!isNaN(newTime) && newTime >= 0) {
      onTimeAdjust?.(bed.id, newTime);
    }
    setShowTimeEdit(false);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card 
      className={`p-2 min-h-[100px] transition-all duration-200 ${
        bed.patient ? 'bg-blue-50' : 'bg-gray-50 border-dashed'
      } ${className}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, bed.id)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            Bed {bed.bedNumber}
          </Badge>
          {bed.patient && (
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              Occupied
            </Badge>
          )}
        </div>
        {bed.patient && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDischarge?.(bed.id)}
            className="h-5 w-5 p-0 hover:bg-red-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {bed.patient ? (
        <div className="space-y-1">
          <TreatmentPatientCard 
            patient={bed.patient} 
            remainingTime={bed.remainingTime}
            arrivalTime={bed.patient.arrivalTime}
            waitedTime={bed.patient.waitingTime}
            className="bg-white" 
          />
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-green-600">
              <Clock className="w-3 h-3" />
              <span>Remaining: {formatTime(bed.remainingTime)}</span>
            </div>
            
            {showTimeEdit ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="h-5 w-12 text-xs"
                  min="0"
                />
                <Button
                  size="sm"
                  onClick={handleTimeSubmit}
                  className="h-5 px-1 text-xs"
                >
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimeEdit(false)}
                  className="h-5 px-1 text-xs"
                >
                  ✕
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeEdit(true)}
                className="h-5 px-2 text-xs"
              >
                Adjust
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <div className="text-center">
            <User className="w-5 h-5 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Available</p>
          </div>
        </div>
      )}
    </Card>
  );
}