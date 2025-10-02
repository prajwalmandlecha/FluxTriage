import React, { useState, useEffect, useCallback } from 'react';
import { Patient, TriageZone, DashboardKPIs } from './types/patient';
import { useBackendData } from './hooks/useBackendData';
import { sortZones } from './utils/heapUtils';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ZonePage } from './components/ZonePage';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { triageApi } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  
  // Use backend data instead of mock data
  const { zones: backendZones, loading, error, refresh } = useBackendData();
  const [zones, setZones] = useState<TriageZone[]>([]);

  // Update local zones when backend data changes
  useEffect(() => {
    if (backendZones.length > 0) {
      setZones(backendZones);
    }
  }, [backendZones]);

  // Sort zones manually when specific actions occur
  const sortAndUpdateZones = useCallback((newZones: TriageZone[]) => {
    const sortedZones = sortZones(newZones);
    setZones(sortedZones);
    return sortedZones;
  }, []);

  // REMOVED: autoAssignPatients function - Backend handles auto-assignment via fillTreatmentSlots
  // REMOVED: Timer-based waiting/treatment time updates - Backend calculates these dynamically
  // The useBackendData hook polls backend every 30 seconds which keeps data fresh

  const calculateKPIs = (): DashboardKPIs => {
    const totalPatients = zones.reduce((sum, zone) => 
      sum + zone.waitingQueue.length + zone.treatmentQueue.filter(bed => bed.patient).length, 0
    );
    
    const totalWaitTime = zones.reduce((sum, zone) => 
      sum + zone.waitingQueue.reduce((zoneSum, patient) => zoneSum + patient.waitingTime, 0), 0
    );
    
    const waitingPatients = zones.reduce((sum, zone) => sum + zone.waitingQueue.length, 0);
    const avgWaitTime = waitingPatients > 0 ? Math.round(totalWaitTime / waitingPatients) : 0;
    
    const totalBeds = zones.reduce((sum, zone) => sum + zone.maxBeds, 0);
    const occupiedBeds = zones.reduce((sum, zone) => 
      sum + zone.treatmentQueue.filter(bed => bed.patient).length, 0
    );
    
    const criticalCases = zones.reduce((sum, zone) => {
      const criticalWaiting = zone.waitingQueue.filter(p => p.priority === 'Red' || p.priority === 'Orange').length;
      const criticalTreated = zone.treatmentQueue.filter(bed => 
        bed.patient && (bed.patient.priority === 'Red' || bed.patient.priority === 'Orange')
      ).length;
      return sum + criticalWaiting + criticalTreated;
    }, 0);

    return {
      totalPatients,
      avgWaitTime,
      bedOccupancy: occupiedBeds,
      totalBeds,
      criticalCases
    };
  };

  const getZoneCounts = () => {
    // Initialize with default values for all zones
    const defaultCounts = {
      Red: { waiting: 0, treatment: 0 },
      Orange: { waiting: 0, treatment: 0 },
      Yellow: { waiting: 0, treatment: 0 },
      Green: { waiting: 0, treatment: 0 }
    };

    // Update with actual counts if zones exist
    return zones.reduce((acc, zone) => {
      acc[zone.priority] = {
        waiting: zone.waitingQueue.length,
        treatment: zone.treatmentQueue.filter(bed => bed.patient).length
      };
      return acc;
    }, defaultCounts);
  };

  const handleDragStart = (e: React.DragEvent, patient: Patient) => {
    setDraggedPatient(patient);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, bedId: string) => {
    e.preventDefault();
    
    if (!draggedPatient) return;

    setZones(prevZones => {
      const updatedZones = [...prevZones];
      let assignmentMade = false;

      // Find the target bed and zone
      for (const zone of updatedZones) {
        const bed = zone.treatmentQueue.find(b => b.id === bedId);
        
        if (bed && !bed.patient) {
          // Check if patient priority matches zone priority
          if (draggedPatient.priority !== zone.priority) {
            toast.error(`Cannot assign ${draggedPatient.priority} priority patient to ${zone.priority} zone`);
            setDraggedPatient(null);
            return prevZones;
          }

          // Remove patient from waiting queue in all zones
          updatedZones.forEach(z => {
            z.waitingQueue = z.waitingQueue.filter(p => p.id !== draggedPatient.id);
          });

          // Assign patient to bed
          const bedIndex = zone.treatmentQueue.findIndex(b => b.id === bedId);
          // Create a copy of the patient with the current waiting time recorded
          const patientWithWaitTime = {
            ...draggedPatient,
            waitingTime: draggedPatient.waitingTime // This becomes the "waited time" in treatment
          };
          
          zone.treatmentQueue[bedIndex] = {
            ...bed,
            patient: patientWithWaitTime,
            remainingTime: draggedPatient.estimatedTreatmentTime || (Math.floor(Math.random() * 90) + 30),
            treatmentStartTime: new Date()
          };
          
          toast.success(`${draggedPatient.name} assigned to bed ${bed.bedNumber}`);
          assignmentMade = true;
          break;
        }
      }

      setDraggedPatient(null);
      return assignmentMade ? sortZones(updatedZones) : prevZones;
    });
  };

  const handleTimeAdjust = async (bedId: string, newTime: number) => {
    // Find the bed and get its caseId
    let caseId: string | undefined;
    for (const zone of zones) {
      const bed = zone.treatmentQueue.find(b => b.id === bedId);
      if (bed && bed.caseId) {
        caseId = bed.caseId;
        break;
      }
    }

    if (!caseId) {
      toast.error('Cannot update treatment time: case not found');
      return;
    }

    try {
      // Update backend first
      await triageApi.updateTreatmentDuration(caseId, newTime);
      
      // Then update local state
      setZones(prevZones => {
        const updatedZones = prevZones.map(zone => ({
          ...zone,
          treatmentQueue: zone.treatmentQueue.map(bed => 
            bed.id === bedId ? { ...bed, remainingTime: newTime } : bed
          )
        }));
        
        // Sort after time adjustment
        return sortZones(updatedZones);
      });
      
      toast.success(`Treatment time updated to ${newTime} minutes`);
      
      // Refresh data after a short delay to ensure backend is updated
      setTimeout(refresh, 1000);
    } catch (error) {
      console.error('Error updating treatment time:', error);
      toast.error('Failed to update treatment time');
    }
  };

  const handleDischarge = async (bedId: string) => {
    // Find the bed and get its caseId
    let caseId: string | undefined;
    let patientName: string | undefined;
    let bedNumber: string | undefined;
    
    for (const zone of zones) {
      const bed = zone.treatmentQueue.find(b => b.id === bedId);
      if (bed && bed.caseId && bed.patient) {
        caseId = bed.caseId;
        patientName = bed.patient.name;
        bedNumber = bed.bedNumber;
        break;
      }
    }

    if (!caseId) {
      toast.error('Cannot discharge: case not found');
      return;
    }

    try {
      // Call backend API to discharge patient
      await triageApi.dischargePatient(caseId);
      
      toast.success(`${patientName} discharged from bed ${bedNumber}`);
      
      // Refresh data after a short delay to get updated state from backend
      setTimeout(refresh, 1000);
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Failed to discharge patient');
    }
  };

  const handleDischargeOld_UNUSED = (bedId: string) => {
    setZones(prevZones => {
      const updatedZones = prevZones.map(zone => ({
        ...zone,
        treatmentQueue: zone.treatmentQueue.map(bed => {
          if (bed.id === bedId && bed.patient) {
            toast.success(`${bed.patient.name} discharged from bed ${bed.bedNumber}`);
            return {
              ...bed,
              patient: null,
              remainingTime: 0,
              treatmentStartTime: null
            };
          }
          return bed;
        })
      }));
      
      // Sort after discharge
      return sortZones(updatedZones);
    });
  };

  const handleAddPatient = (newPatient: Patient) => {
    // Patient is already added to backend by AddPatientForm
    // Just refresh the data from backend
    toast.success(`Patient ${newPatient.name} added successfully!`);
    
    // Refresh backend data after a short delay to ensure database is updated
    setTimeout(() => {
      refresh();
    }, 500);
  };

  const getCurrentZone = () => {
    return zones.find(zone => zone.priority === currentPage);
  };

  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return (
        <HomePage 
          zones={zones} 
          kpis={calculateKPIs()}
          onAddPatient={handleAddPatient} 
        />
      );
    }

    const zone = getCurrentZone();
    if (zone) {
      return (
        <ZonePage
          zone={zone}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTimeAdjust={handleTimeAdjust}
          onDischarge={handleDischarge}
        />
      );
    }

    return <div>Page not found</div>;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        zoneCounts={getZoneCounts()}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderCurrentPage()}
      </div>
      
      <Toaster />
    </div>
  );
}