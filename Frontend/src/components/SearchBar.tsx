import React, { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Patient, SearchResult } from '../types/patient';
import { Search, User, Phone, Clock, Activity } from 'lucide-react';

interface SearchBarProps {
  patients: Patient[];
  onResultSelect?: (result: SearchResult) => void;
}

export function SearchBar({ patients, onResultSelect }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Memoize the search results to prevent infinite loops
  const searchResults = useMemo(() => {
    if (searchTerm.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];
    const searchLower = searchTerm.toLowerCase();

    // Search patients
    patients.forEach(patient => {
      if (
        patient.name.toLowerCase().includes(searchLower) ||
        patient.id.toLowerCase().includes(searchLower) ||
        patient.symptoms.toLowerCase().includes(searchLower) ||
        patient.diagnosis.toLowerCase().includes(searchLower)
      ) {
        results.push({
          type: 'Patient',
          id: patient.id,
          name: patient.name,
          details: patient
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchTerm, patients]);

  useEffect(() => {
    setResults(searchResults);
    setShowResults(searchResults.length > 0 && searchTerm.length >= 2);
  }, [searchResults, searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setShowResults(false);
    onResultSelect?.(result);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
    setSelectedResult(null);
  };

  const renderPatientResult = (patient: Patient) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="font-medium">{patient.name}</span>
          <Badge className={`text-xs ${
            patient.priority === 'Red' ? 'bg-red-100 text-red-800' :
            patient.priority === 'Orange' ? 'bg-orange-100 text-orange-800' :
            patient.priority === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {patient.priority}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">{patient.id}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div>{patient.age}y, {patient.gender}</div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {patient.waitingTime}m wait
        </div>
        <div className="col-span-2 truncate">{patient.symptoms}</div>
        <div className="col-span-2 truncate text-xs">{patient.diagnosis}</div>
        <div className="flex items-center gap-1 text-xs">
          <Phone className="w-3 h-3" />
          {patient.contactNumber}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Activity className="w-3 h-3" />
          {patient.vitals.pulse}bpm, {patient.vitals.oxygenSat.toFixed(2)}%
        </div>
      </div>
    </div>
  );



  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients or medical conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1 h-8 w-8 p-0"
            >
              ×
            </Button>
          )}
        </div>

        {showResults && results.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-1 max-h-80 overflow-y-auto shadow-lg border">
            <div className="space-y-1">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="p-2 hover:bg-muted rounded-md cursor-pointer transition-colors border-b border-border last:border-b-0"
                  onClick={() => handleResultClick(result)}
                >
                  {renderPatientResult(result.details as Patient)}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {selectedResult && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Selected {selectedResult.type}: {selectedResult.name}</h4>
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 w-6 p-0">
              ×
            </Button>
          </div>
          {renderPatientResult(selectedResult.details as Patient)}
        </Card>
      )}
    </div>
  );
}