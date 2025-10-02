import React from 'react';
import { DashboardKPIs } from '../types/patient';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, Clock, Bed, AlertTriangle, Users } from 'lucide-react';

interface DashboardHeaderProps {
  kpis: DashboardKPIs;
}

export function DashboardHeader({ kpis }: DashboardHeaderProps) {
  const occupancyPercentage = Math.round((kpis.bedOccupancy / kpis.totalBeds) * 100);
  
  return (
    <div className="bg-white border-b border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl">FluxTriage ED Dashboard</h1>
          <p className="text-muted-foreground">Emergency Department Patient Management System</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Last Updated: {new Date().toLocaleTimeString()}</p>
          <p>Status: <Badge className="bg-green-100 text-green-800">Active</Badge></p>
        </div>
      </div>

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
              <p className="text-2xl">{occupancyPercentage}%</p>
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
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-lg">Operational</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}