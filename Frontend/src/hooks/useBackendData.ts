import { useState, useEffect, useCallback } from 'react';
import { triageApi, patientApi } from '../services/api';
import { Patient, TriageZone } from '../types/patient';
import { toast } from 'sonner';

interface ZoneQueue {
  cases: any[];
  count: number;
}

interface QueueData {
  RED: ZoneQueue;
  ORANGE: ZoneQueue;
  YELLOW: ZoneQueue;
  GREEN: ZoneQueue;
}

export function useBackendData() {
  const [zones, setZones] = useState<TriageZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert backend case data to frontend Patient format
  const convertCaseToPatient = (caseData: any): Patient => {
    const patient = caseData.patient;
    
    // Backend stores vitals as a JSON object in the 'vitals' field
    // Convert from backend format to frontend format
    const backendVitals = caseData.vitals || {};
    
    // Map backend consciousness to frontend format
    const consciousnessMap: { [key: string]: 'A' | 'C' | 'V' | 'P' | 'U' } = {
      'ALERT': 'A',
      'CONFUSED': 'C',
      'VOICE': 'V',
      'PAIN': 'P',
      'UNRESPONSIVE': 'U'
    };

    const vitals = {
      respiratoryRate: backendVitals.respiratory_rate || 0,
      oxygenSat: backendVitals.oxygen_saturation || 0,
      oxygenSupport: backendVitals.supplemental_oxygen || false,
      systolicBP: backendVitals.systolic_bp || 0,
      pulse: backendVitals.heart_rate || 0,
      temperature: backendVitals.temperature || 0,
      consciousness: consciousnessMap[backendVitals.consciousness_level] || 'A'
    };

    // Calculate waited time only for WAITING status
    let waitingTime = 0;
    let treatmentTime = 0;
    if (caseData.status === 'WAITING') {
      waitingTime = Math.floor((Date.now() - new Date(caseData.arrival_time).getTime()) / 60000);
    } else if (caseData.status === 'IN_TREATMENT') {
      // Use last_eval_time as treatment start
      treatmentTime = Math.floor((Date.now() - new Date(caseData.last_eval_time).getTime()) / 60000);
    }

    // Calculate maxWaitingTime with fallback logic
    // Note: 0 is a valid value for critical diseases (RED zone - immediate treatment)
    const maxWaitingTime = (caseData.disease && typeof caseData.disease.max_wait_time === 'number')
      ? caseData.disease.max_wait_time
      : (typeof caseData.max_wait_time === 'number' ? caseData.max_wait_time : null);

    return {
      id: patient.id,
      firstName: patient.name.split(' ')[0] || '',
      lastName: patient.name.split(' ').slice(1).join(' ') || '',
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      age: patient.age || caseData.age || 0,
      gender: patient.gender === 'MALE' ? 'Male' : 'Female',
      priority: caseData.zone.charAt(0) + caseData.zone.slice(1).toLowerCase() as 'Red' | 'Orange' | 'Yellow' | 'Green',
      priorityScore: caseData.priority,
      vitals,
      symptoms: caseData.symptoms || '',
      diagnosis: caseData.diagnosis || '',
      diseaseCode: caseData.disease_code || '',
      severityIndex: caseData.si || 1,
      resourceScore: caseData.resource_score || 0,
      estimatedTreatmentTime: caseData.treatment_duration || 0,
      maxWaitingTime,
      news2Score: caseData.news2 || 0,
      waitingTime,
      treatmentTime,
      arrivalTime: new Date(caseData.arrival_time),
      contactNumber: patient.phone || '',
      status: caseData.status
    };
  };

  // Fetch waiting and treatment queues from backend
  const fetchQueues = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both waiting and treatment queues
      const [waitingResponse, treatmentResponse] = await Promise.all([
        triageApi.getWaitingQueues(),
        triageApi.getTreatmentQueues()
      ]);

      const waitingData: QueueData = waitingResponse.data;
      const treatmentData: QueueData = treatmentResponse.data;

      // Define zones with colors and bed counts
      const zoneConfigs = [
        { priority: 'Red' as const, name: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', maxBeds: 5 },
        { priority: 'Orange' as const, name: 'Urgent', color: 'text-orange-600', bgColor: 'bg-orange-50', maxBeds: 8 },
        { priority: 'Yellow' as const, name: 'Semi-Urgent', color: 'text-yellow-600', bgColor: 'bg-yellow-50', maxBeds: 10 },
        { priority: 'Green' as const, name: 'Non-Urgent', color: 'text-green-600', bgColor: 'bg-green-50', maxBeds: 15 }
      ];

      const newZones: TriageZone[] = zoneConfigs.map(config => {
        const zoneKey = config.priority.toUpperCase() as keyof QueueData;
        
        // Get cases array from response (backend returns { cases, count })
        const waitingCases = waitingData[zoneKey]?.cases || [];
        const treatmentCases = treatmentData[zoneKey]?.cases || [];
        
        // Convert waiting queue cases to patients
        const waitingQueue = waitingCases
          .filter((c: any) => c.status === 'WAITING')
          .map(convertCaseToPatient);

        // Convert treatment queue cases to treatment beds
        const treatmentPatients = treatmentCases
          .filter((c: any) => c.status === 'IN_TREATMENT');
        
        // Assign stable bed numbers within zone capacity
        // Strategy: Use the case ID hash to assign beds consistently
        // This ensures bed numbers stay within 1-maxBeds range
        const bedNumberMap = new Map<string, number>();
        const usedBeds = new Set<number>();
        
        // Sort by treatment start time for consistent assignment
        const patientsWithStableBeds = treatmentPatients.map((caseData: any) => {
          const treatmentStartTime = new Date(caseData.last_eval_time);
          return { caseData, treatmentStartTime };
        });
        patientsWithStableBeds.sort((a, b) => 
          a.treatmentStartTime.getTime() - b.treatmentStartTime.getTime()
        );
        
        // Assign beds: each patient gets the lowest available bed number
        for (const item of patientsWithStableBeds) {
          // Find the lowest available bed number
          for (let bedNum = 1; bedNum <= config.maxBeds; bedNum++) {
            if (!usedBeds.has(bedNum)) {
              bedNumberMap.set(item.caseData.id, bedNum);
              usedBeds.add(bedNum);
              break;
            }
          }
        }
        
        // Create treatment beds with patients - backend returns them sorted by remaining time
        // But we use stable bed numbers from the mapping
        const treatmentQueue = treatmentPatients.map((caseData: any) => {
          const patient = convertCaseToPatient(caseData);
          // Calculate remaining time: total treatment duration - elapsed time
          const treatmentStartTime = new Date(caseData.last_eval_time);
          const elapsedMinutes = Math.floor((Date.now() - treatmentStartTime.getTime()) / 60000);
          const totalTreatmentTime = caseData.treatment_duration || 0;
          const remainingTime = Math.max(0, totalTreatmentTime - elapsedMinutes);
          
          const stableBedNumber = bedNumberMap.get(caseData.id) || 0;
          const bedNumberStr = `${stableBedNumber}`;
          
          return {
            id: `${config.priority}-BED-${bedNumberStr}`,
            bedNumber: bedNumberStr,
            caseId: caseData.id, // Store the case ID for backend updates
            patient,
            remainingTime,
            treatmentStartTime
          };
        });
        
        // Add empty beds to fill remaining capacity
        const occupiedBedNumbers = new Set(Array.from(bedNumberMap.values()));
        const emptyBeds = [];
        for (let i = 1; i <= config.maxBeds; i++) {
          if (!occupiedBedNumbers.has(i)) {
            emptyBeds.push({
              id: `${config.priority}-BED-${i}`,
              bedNumber: `${i}`,
              caseId: undefined,
              patient: null,
              remainingTime: 0,
              treatmentStartTime: null
            } as any);
          }
        }
        
        // Sort treatment queue by remaining time for display, but beds keep their stable numbers
        treatmentQueue.sort((a, b) => a.remainingTime - b.remainingTime);
        
        // Append empty beds at the end
        treatmentQueue.push(...emptyBeds);

        return {
          priority: config.priority,
          name: config.name,
          color: config.color,
          bgColor: config.bgColor,
          waitingQueue,
          treatmentQueue,
          maxBeds: config.maxBeds
        };
      });

      setZones(newZones);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching queues:', err);
      setError(err.message || 'Failed to fetch queue data');
      toast.error('Failed to load patient data from backend');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchQueues();
    
    // Poll every 30 seconds to keep data fresh
    const interval = setInterval(fetchQueues, 30000);
    
    return () => clearInterval(interval);
  }, [fetchQueues]);

  // Refresh function to manually reload data
  const refresh = useCallback(() => {
    fetchQueues();
  }, [fetchQueues]);

  return {
    zones,
    loading,
    error,
    refresh
  };
}
