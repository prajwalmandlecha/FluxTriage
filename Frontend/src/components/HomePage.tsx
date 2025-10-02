import React, { useMemo } from 'react';
import { Patient } from '../types/patient';
import { TriageZone, ZoneOverview, DashboardKPIs } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { SearchBar } from './SearchBar';
import { AddPatientForm } from './AddPatientForm';
import { 
  Users, 
  Clock, 
  Bed, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  UserCheck,
  Stethoscope,
  Search,
  Plus
} from 'lucide-react';

interface HomePageProps {
  zones: TriageZone[];
  kpis: DashboardKPIs;
  onAddPatient: (patient: Patient) => void;
}

export function HomePage({ zones, kpis, onAddPatient }: HomePageProps) {
  const [showAddPatientForm, setShowAddPatientForm] = React.useState(false);
  const allPatients = useMemo(() => {
    const patients: Patient[] = [];
    zones.forEach(zone => {
      patients.push(...zone.waitingQueue.filter(p => p.status !== 'DISCHARGED'));
      zone.treatmentQueue.forEach(bed => {
        if (bed.patient && bed.patient.status !== 'DISCHARGED') patients.push(bed.patient);
      });
    });
    return patients;
  }, [zones]);

  const zoneOverviews = useMemo((): ZoneOverview[] => {
    return zones.map(zone => {
      const waitingPatients = zone.waitingQueue.filter(p => p.status !== 'DISCHARGED');
      const treatmentPatients = zone.treatmentQueue.filter(bed => bed.patient && bed.patient.status !== 'DISCHARGED').map(bed => bed.patient!);
      const allZonePatients = [...waitingPatients, ...treatmentPatients];

      const avgWaitTime = waitingPatients.length > 0 
        ? Math.round(waitingPatients.reduce((sum, p) => sum + p.waitingTime, 0) / waitingPatients.length)
        : 0;

      // Get most common diseases/symptoms in this zone
      const diseaseCount: { [key: string]: number } = {};
      allZonePatients.forEach(patient => {
        diseaseCount[patient.diagnosis] = (diseaseCount[patient.diagnosis] || 0) + 1;
      });

      const commonDiseases = Object.entries(diseaseCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([disease]) => disease);

      return {
        priority: zone.priority,
        name: zone.name,
        waitingCount: waitingPatients.length,
        treatmentCount: treatmentPatients.length,
        avgWaitTime,
        commonDiseases
      };
    });
  }, [zones]);

  const diseaseStats = useMemo(() => {
    const diseaseCount: { [key: string]: number } = {};
    
    allPatients.forEach(patient => {
      diseaseCount[patient.diagnosis] = (diseaseCount[patient.diagnosis] || 0) + 1;
    });
    
    return Object.entries(diseaseCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }, [allPatients]);





  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl">{kpis.totalPatients}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Wait Time</p>
              <p className="text-2xl">{kpis.avgWaitTime}m</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bed className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bed Occupancy</p>
              <p className="text-2xl">{Math.round((kpis.bedOccupancy / kpis.totalBeds) * 100)}%</p>
              <p className="text-xs text-muted-foreground">{kpis.bedOccupancy}/{kpis.totalBeds}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Cases</p>
              <p className="text-2xl">{kpis.criticalCases}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Escalation Needed</p>
              <p className="text-2xl">{allPatients.filter(p => p.status === 'WAITING' && typeof p.maxWaitingTime === 'number' && p.waitingTime > p.maxWaitingTime).length}</p>
              <p className="text-xs text-muted-foreground">patients needing escalation</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Add Patient */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5" />
            <h3>Search Patients</h3>
            <Badge variant="outline" className="text-xs">
              {allPatients.length} patients
            </Badge>
          </div>
          <SearchBar patients={allPatients} />
        </Card>
        
        <Card className="p-4 flex items-center justify-center">
          <Button
            onClick={() => setShowAddPatientForm(true)}
            className="w-full h-full min-h-[80px] flex flex-col gap-2"
            size="lg"
          >
            <Plus className="w-6 h-6" />
            <span>Add New Patient</span>
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Overview */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Zone Overview
          </h3>
          <div className="space-y-4">
            {zoneOverviews.map((zone) => (
              <div key={zone.priority} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      zone.priority === 'Red' ? 'bg-red-500' :
                      zone.priority === 'Orange' ? 'bg-orange-500' :
                      zone.priority === 'Yellow' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <h4 className={`${
                      zone.priority === 'Red' ? 'text-red-600' :
                      zone.priority === 'Orange' ? 'text-orange-600' :
                      zone.priority === 'Yellow' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {zone.name}
                    </h4>
                  </div>
                  <Badge variant="outline">{zone.priority} Priority</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Waiting</p>
                    <p className="text-lg">{zone.waitingCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">In Treatment</p>
                    <p className="text-lg">{zone.treatmentCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Wait</p>
                    <p className="text-lg">{zone.avgWaitTime}m</p>
                  </div>
                </div>
                
                {zone.commonDiseases.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Common Conditions:</p>
                    <div className="flex flex-wrap gap-1">
                      {zone.commonDiseases.map((disease, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {disease}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Disease Statistics */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Most Common Conditions
          </h3>
          <div className="space-y-3">
            {diseaseStats.map(([disease, count], index) => (
              <div key={disease} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{disease}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / allPatients.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add Patient Form Modal */}
      {showAddPatientForm && (
        <AddPatientForm
          onAddPatient={(patient) => {
            onAddPatient(patient);
            setShowAddPatientForm(false);
          }}
          onClose={() => setShowAddPatientForm(false)}
        />
      )}

      </div>
    </div>
  );
}