// Helper hooks for fetching triage data from backend
// Add this file to Frontend/src/hooks/ directory

import { useState, useEffect } from 'react';
import { triageApi } from '../services/api';

// Hook to fetch waiting queues
export const useWaitingQueues = (refreshInterval = 30000) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await triageApi.getWaitingQueues();
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching waiting queues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data at interval
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { data, loading, error, refetch: fetchData };
};

// Hook to fetch treatment queues
export const useTreatmentQueues = (refreshInterval = 30000) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await triageApi.getTreatmentQueues();
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching treatment queues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data at interval
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { data, loading, error, refetch: fetchData };
};

// Hook to fetch both queues together
export const useTriageQueues = (refreshInterval = 30000) => {
  const waiting = useWaitingQueues(refreshInterval);
  const treatment = useTreatmentQueues(refreshInterval);

  return {
    waiting,
    treatment,
    loading: waiting.loading || treatment.loading,
    error: waiting.error || treatment.error,
    refetch: () => {
      waiting.refetch();
      treatment.refetch();
    }
  };
};

// Hook for queue statistics
export const useQueueStats = (refreshInterval = 30000) => {
  const { waiting, treatment } = useTriageQueues(refreshInterval);

  const stats = {
    totalWaiting: 0,
    totalInTreatment: 0,
    bedOccupancy: 0,
    totalBeds: 0,
    criticalCases: 0,
    avgWaitTime: 0,
  };

  if (waiting.data && treatment.data) {
    const zones = ['RED', 'ORANGE', 'YELLOW', 'GREEN'];
    
    zones.forEach(zone => {
      const waitingCount = waiting.data[zone]?.count || 0;
      const treatmentData = treatment.data[zone];
      
      stats.totalWaiting += waitingCount;
      stats.totalInTreatment += treatmentData?.count || 0;
      stats.totalBeds += treatmentData?.capacity || 0;
      
      if (zone === 'RED') {
        stats.criticalCases += waitingCount + (treatmentData?.count || 0);
      }
    });

    stats.bedOccupancy = stats.totalBeds > 0 
      ? Math.round((stats.totalInTreatment / stats.totalBeds) * 100) 
      : 0;
  }

  return {
    ...stats,
    loading: waiting.loading || treatment.loading,
    error: waiting.error || treatment.error,
  };
};

/* USAGE EXAMPLES:

// In HomePage.tsx or any component:

import { useTriageQueues, useQueueStats } from '../hooks/useTriageData';

function HomePage() {
  const { waiting, treatment, loading, error } = useTriageQueues(30000); // Refresh every 30s
  const stats = useQueueStats(30000);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Total Waiting: {stats.totalWaiting}</h1>
      <h1>Total in Treatment: {stats.totalInTreatment}</h1>
      <h1>Bed Occupancy: {stats.bedOccupancy}%</h1>
      
      {/* Display waiting queue for RED zone *\/}
      <div>
        <h2>RED Zone - Waiting</h2>
        {waiting.data?.RED?.cases.map(case => (
          <div key={case.id}>
            {case.patient.name} - Priority: {case.priority}
          </div>
        ))}
      </div>
    </div>
  );
}

// For ZonePage.tsx:

function ZonePage({ zone }: { zone: 'Red' | 'Orange' | 'Yellow' | 'Green' }) {
  const { waiting, treatment } = useTriageQueues(15000); // Refresh every 15s
  const zoneUpper = zone.toUpperCase();

  const waitingCases = waiting.data?.[zoneUpper]?.cases || [];
  const treatmentCases = treatment.data?.[zoneUpper]?.cases || [];

  return (
    <div>
      <h1>{zone} Zone</h1>
      
      <h2>Waiting ({waitingCases.length})</h2>
      {waitingCases.map(case => (
        <PatientCard key={case.id} patient={case.patient} priority={case.priority} />
      ))}
      
      <h2>In Treatment ({treatmentCases.length})</h2>
      {treatmentCases.map(case => (
        <TreatmentCard key={case.id} patient={case.patient} />
      ))}
    </div>
  );
}

*/
