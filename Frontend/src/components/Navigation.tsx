import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Home, Activity, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  zoneCounts: {
    Red: { waiting: number; treatment: number };
    Orange: { waiting: number; treatment: number };
    Yellow: { waiting: number; treatment: number };
    Green: { waiting: number; treatment: number };
  };
}

export function Navigation({ currentPage, onPageChange, zoneCounts }: NavigationProps) {
  const navItems = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      icon: Home, 
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50'
    },
    { 
      id: 'Red', 
      label: 'Critical', 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bgColor: 'hover:bg-red-50',
      waiting: zoneCounts.Red?.waiting || 0,
      treatment: zoneCounts.Red?.treatment || 0
    },
    { 
      id: 'Orange', 
      label: 'Urgent', 
      icon: Activity, 
      color: 'text-orange-600',
      bgColor: 'hover:bg-orange-50',
      waiting: zoneCounts.Orange?.waiting || 0,
      treatment: zoneCounts.Orange?.treatment || 0
    },
    { 
      id: 'Yellow', 
      label: 'Less Urgent', 
      icon: Clock, 
      color: 'text-yellow-600',
      bgColor: 'hover:bg-yellow-50',
      waiting: zoneCounts.Yellow?.waiting || 0,
      treatment: zoneCounts.Yellow?.treatment || 0
    },
    { 
      id: 'Green', 
      label: 'Non-Urgent', 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
      waiting: zoneCounts.Green?.waiting || 0,
      treatment: zoneCounts.Green?.treatment || 0
    }
  ];

  return (
    <nav className="bg-white border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl">FluxTriage ED</h1>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Live
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onPageChange(item.id)}
                className={`relative ${item.bgColor} ${item.color} ${
                  isActive ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
                
                {typeof item.waiting === 'number' && typeof item.treatment === 'number' && (
                  <div className="ml-2 flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      W: {item.waiting}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      T: {item.treatment}
                    </Badge>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </nav>
  );
}