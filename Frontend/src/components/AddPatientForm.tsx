import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { X, Plus, Search } from 'lucide-react';
import { Patient, Disease } from '../types/patient';
import { diseaseApi } from '../services/api';
import { calculateNEWS2Score, updatePatientPriority } from '../utils/priorityCalculation';
import { toast } from 'sonner';

interface AddPatientFormProps {
  onAddPatient: (patient: Patient) => void;
  onClose: () => void;
}

interface ManualDiseaseData {
  disease: string;
  severityIndex: number;
  resourceScore: number;
  estimatedTreatmentTime: number;
  maxWaitingTime: number;
}

export function AddPatientForm({ onAddPatient, onClose }: AddPatientFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'Male' | 'Female' | '',
    phone: '',
    // Vitals
    respiratoryRate: '',
    oxygenSat: '',
    oxygenSupport: false,
    systolicBP: '',
    pulse: '',
    temperature: '',
    consciousness: '' as 'A' | 'C' | 'V' | 'P' | 'U' | '',
    // Disease
    symptoms: '',
    selectedDisease: null as any,
    diseaseSearch: '',
    useManualDisease: false,
    manualDiseaseData: {
      disease: '',
      severityIndex: 1,
      resourceScore: 1.0,
      estimatedTreatmentTime: 30,
      maxWaitingTime: 60
    } as ManualDiseaseData
  });

  const [diseaseSearchResults, setDiseaseSearchResults] = useState<any[]>([]);
  const [allDiseases, setAllDiseases] = useState<any[]>([]);
  const [showDiseaseSearch, setShowDiseaseSearch] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<any>(null);

  // Fetch all diseases on component mount
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await diseaseApi.getAll();
        setAllDiseases(response.data);
      } catch (error) {
        console.error('Error fetching diseases:', error);
        toast.error('Failed to load diseases from database');
      }
    };
    fetchDiseases();
  }, []);

  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDiseaseSearch = (searchTerm: string) => {
    setFormData(prev => ({ ...prev, diseaseSearch: searchTerm }));
    if (searchTerm.length === 0) {
      // Show all diseases when nothing is searched
      setDiseaseSearchResults(allDiseases);
      setShowDiseaseSearch(true);
    } else if (searchTerm.length >= 1) {
      // Filter diseases locally based on name, code, or description
      const results = allDiseases.filter(disease => 
        disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disease.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (disease.description && disease.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setDiseaseSearchResults(results);
      setShowDiseaseSearch(true);
    } else {
      setDiseaseSearchResults([]);
      setShowDiseaseSearch(false);
    }
  };

  const selectDisease = (disease: any) => {
    setFormData(prev => ({
      ...prev,
      selectedDisease: disease,
      diseaseSearch: disease.name,
      useManualDisease: false
    }));
    setShowDiseaseSearch(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.disease-search-container')) {
        setShowDiseaseSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleManualDisease = () => {
    setFormData(prev => ({
      ...prev,
      useManualDisease: !prev.useManualDisease,
      selectedDisease: null,
      diseaseSearch: ''
    }));
    setShowDiseaseSearch(false);
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.dateOfBirth) return 'Date of birth is required';
    if (!formData.gender) return 'Gender is required';
    if (!formData.phone.trim()) return 'Phone number is required';
    if (!formData.respiratoryRate || isNaN(Number(formData.respiratoryRate))) return 'Valid respiratory rate is required';
    if (!formData.oxygenSat || isNaN(Number(formData.oxygenSat))) return 'Valid oxygen saturation is required';
    if (!formData.systolicBP || isNaN(Number(formData.systolicBP))) return 'Valid systolic BP is required';
    if (!formData.pulse || isNaN(Number(formData.pulse))) return 'Valid pulse is required';
    if (!formData.temperature || isNaN(Number(formData.temperature))) return 'Valid temperature is required';
    if (!formData.consciousness) return 'Consciousness level is required';
    // Symptoms are optional
    
    if (formData.useManualDisease) {
      if (!formData.manualDiseaseData.disease.trim()) return 'Disease name is required';
    } else {
      if (!formData.selectedDisease) return 'Please select a disease or use manual entry';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    
    // Use selected disease or manual disease data
    // Backend disease format: {code, name, description, treatment_time, max_wait_time, severity}
    // Calculate resourceScore based on severity: 4=4.0, 3=3.0, 2=2.0, 1=1.0
    const diseaseData = formData.useManualDisease 
      ? {
          name: formData.manualDiseaseData.disease,
          code: null, // Use null for manual disease entry (no disease_code in DB)
          severity: formData.manualDiseaseData.severityIndex,
          resourceScore: formData.manualDiseaseData.resourceScore,
          treatment_time: formData.manualDiseaseData.estimatedTreatmentTime,
          max_wait_time: formData.manualDiseaseData.maxWaitingTime
        }
      : {
          name: formData.selectedDisease!.name,
          code: formData.selectedDisease!.code,
          severity: formData.selectedDisease!.severity,
          resourceScore: formData.selectedDisease!.resource_score,
          treatment_time: formData.selectedDisease!.treatment_time,
          max_wait_time: formData.selectedDisease!.max_wait_time
        };

    const vitals = {
      respiratoryRate: Number(formData.respiratoryRate),
      oxygenSat: Number(formData.oxygenSat),
      oxygenSupport: formData.oxygenSupport,
      systolicBP: Number(formData.systolicBP),
      pulse: Number(formData.pulse),
      temperature: Number(formData.temperature),
      consciousness: formData.consciousness as 'A' | 'C' | 'V' | 'P' | 'U'
    };

    const news2Score = calculateNEWS2Score(vitals);

    try {
      // Import the API service
      const { patientApi } = await import('../services/api');

      // Prepare payload
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        age,
        gender: formData.gender as 'Male' | 'Female',
        phone: formData.phone,
        vitals,
        symptoms: formData.symptoms || '', // Ensure it's never undefined
        diagnosis: diseaseData.name,
        diseaseCode: diseaseData.code,
        severityIndex: diseaseData.severity,
        resourceScore: diseaseData.resourceScore,
        maxWaitingTime: diseaseData.max_wait_time,  // Include for manual entries
        estimatedTreatmentTime: diseaseData.treatment_time  // Include for manual entries
      };

      // Call the unified backend endpoint
      const response = await patientApi.addToED(payload);

      const patientName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      
      if (response.patientExists) {
        toast.success(`Existing patient ${patientName} added to ED successfully`);
      } else {
        toast.success(`New patient ${patientName} created and added to ED successfully`);
      }

      // Create a patient object for the local state
      const localPatient: Patient = {
    id: response.data.patient.id,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    name: patientName,
    dateOfBirth: formData.dateOfBirth,
    age,
    gender: formData.gender as 'Male' | 'Female',
    priority: response.data.case.zone.charAt(0) + response.data.case.zone.slice(1).toLowerCase() as 'Red' | 'Orange' | 'Yellow' | 'Green',
    priorityScore: response.data.case.priority,
    vitals,
    symptoms: formData.symptoms,
    diagnosis: diseaseData.name,
    diseaseCode: diseaseData.code || '',
    severityIndex: diseaseData.severity,
    resourceScore: diseaseData.resourceScore,
    estimatedTreatmentTime: diseaseData.treatment_time,
    maxWaitingTime: diseaseData.max_wait_time,
    news2Score,
    waitingTime: 0,
    treatmentTime: 0,
    status: response.data.case.status || 'WAITING',
    arrivalTime: new Date(response.data.case.arrival_time),
    contactNumber: formData.phone
      };
      
      onAddPatient(localPatient);
      onClose();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast.error(error.response?.data?.message || 'Failed to add patient to ED. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Add New Patient</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
                {formData.dateOfBirth && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Age: {calculateAge(formData.dateOfBirth)} years
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value: 'Male' | 'Female') => 
                  setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Vitals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="respiratoryRate">Respiratory Rate * (br/min)</Label>
                  <Input
                    id="respiratoryRate"
                    type="number"
                    value={formData.respiratoryRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                    placeholder="12-20"
                  />
                </div>
                <div>
                  <Label htmlFor="oxygenSat">Oxygen Saturation * (%)</Label>
                  <Input
                    id="oxygenSat"
                    type="number"
                    value={formData.oxygenSat}
                    onChange={(e) => setFormData(prev => ({ ...prev, oxygenSat: e.target.value }))}
                    placeholder="94-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oxygenSupport"
                    checked={formData.oxygenSupport}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ 
                      ...prev, 
                      oxygenSupport: checked 
                    }))}
                  />
                  <Label htmlFor="oxygenSupport">On supplemental O₂</Label>
                </div>
                <div>
                  <Label htmlFor="systolicBP">Systolic BP * (mmHg)</Label>
                  <Input
                    id="systolicBP"
                    type="number"
                    value={formData.systolicBP}
                    onChange={(e) => setFormData(prev => ({ ...prev, systolicBP: e.target.value }))}
                    placeholder="110-140"
                  />
                </div>
                <div>
                  <Label htmlFor="pulse">Pulse * (bpm)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    value={formData.pulse}
                    onChange={(e) => setFormData(prev => ({ ...prev, pulse: e.target.value }))}
                    placeholder="60-100"
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature * (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="36.5-37.5"
                  />
                </div>
                <div>
                  <Label htmlFor="consciousness">Consciousness Level * (ACVPU)</Label>
                  <Select value={formData.consciousness} onValueChange={(value: 'A' | 'C' | 'V' | 'P' | 'U') => 
                    setFormData(prev => ({ ...prev, consciousness: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Alert (A)</SelectItem>
                      <SelectItem value="C">Confused (C)</SelectItem>
                      <SelectItem value="V">Voice responsive (V)</SelectItem>
                      <SelectItem value="P">Pain responsive (P)</SelectItem>
                      <SelectItem value="U">Unresponsive (U)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Symptoms and Disease */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medical Information</h3>
              <div>
                <Label htmlFor="symptoms">Symptoms (optional)</Label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Describe patient's symptoms (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h4 className="font-medium">Disease/Condition *</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleManualDisease}
                  >
                    {formData.useManualDisease ? 'Use Database' : 'Manual Entry'}
                  </Button>
                </div>

                {!formData.useManualDisease ? (
                  <div className="relative disease-search-container">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for disease/condition..."
                        value={formData.diseaseSearch}
                        onChange={(e) => handleDiseaseSearch(e.target.value)}
                        className="pl-10"
                        onFocus={() => {
                          if (formData.diseaseSearch.length === 0) {
                            setDiseaseSearchResults(allDiseases);
                            setShowDiseaseSearch(true);
                          }
                        }}
                      />
                    </div>

                    {showDiseaseSearch && (
                      <Card className="absolute top-full left-0 right-0 z-10 mt-1 p-2 max-h-60 overflow-y-auto shadow-lg border">
                        {diseaseSearchResults.length > 0 ? (
                          diseaseSearchResults.map((disease) => (
                            <div
                              key={disease.code}
                              className="p-2 hover:bg-muted rounded cursor-pointer border-b border-border last:border-b-0"
                              onClick={() => selectDisease(disease)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <span className="font-medium">{disease.name}</span>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Code: {disease.code} • Treatment Time: {disease.treatment_time}min • Max Wait: {disease.max_wait_time}min
                                  </div>
                                </div>
                                <Badge variant={
                                  disease.severity === 4 ? 'destructive' :
                                  disease.severity === 3 ? 'default' :
                                  disease.severity === 2 ? 'secondary' : 'outline'
                                }>
                                  {disease.severity === 4 ? 'RED' :
                                   disease.severity === 3 ? 'ORANGE' :
                                   disease.severity === 2 ? 'YELLOW' : 'GREEN'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">
                            No diseases found matching "{formData.diseaseSearch}"
                          </div>
                        )}
                      </Card>
                    )}

                    {formData.selectedDisease && (
                      <Card className="mt-2 p-3 bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{formData.selectedDisease.name}</h4>
                          <Badge variant={
                            formData.selectedDisease.severity === 4 ? 'destructive' :
                            formData.selectedDisease.severity === 3 ? 'default' :
                            formData.selectedDisease.severity === 2 ? 'secondary' : 'outline'
                          }>
                            {formData.selectedDisease.severity === 4 ? 'RED' :
                             formData.selectedDisease.severity === 3 ? 'ORANGE' :
                             formData.selectedDisease.severity === 2 ? 'YELLOW' : 'GREEN'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>Severity: {formData.selectedDisease.severity}/4</div>
                          <div>Treatment Time: {formData.selectedDisease.treatment_time}min</div>
                          <div>Max Wait: {formData.selectedDisease.max_wait_time}min</div>
                          <div>Code: {formData.selectedDisease.code}</div>
                        </div>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="p-4 space-y-4">
                    <h4 className="font-medium">Manual Disease Entry</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Disease/Condition Name *</Label>
                        <Input
                          value={formData.manualDiseaseData.disease}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            manualDiseaseData: { ...prev.manualDiseaseData, disease: e.target.value }
                          }))}
                          placeholder="Enter disease name"
                        />
                      </div>
                      <div>
                        <Label>Severity Index * (1-4)</Label>
                        <Select 
                          value={formData.manualDiseaseData.severityIndex.toString()} 
                          onValueChange={(value: string) => setFormData(prev => ({
                            ...prev,
                            manualDiseaseData: { ...prev.manualDiseaseData, severityIndex: Number(value) }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Green</SelectItem>
                            <SelectItem value="2">2 - Yellow</SelectItem>
                            <SelectItem value="3">3 - Orange</SelectItem>
                            <SelectItem value="4">4 - Red</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Resource Score * (1.0-5.0)</Label>
                        <Input
                          type="number"
                          min="1.0"
                          max="5.0"
                          step="0.1"
                          value={formData.manualDiseaseData.resourceScore}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            manualDiseaseData: { ...prev.manualDiseaseData, resourceScore: Number(e.target.value) }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Estimated Treatment Time * (minutes)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.manualDiseaseData.estimatedTreatmentTime}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            manualDiseaseData: { ...prev.manualDiseaseData, estimatedTreatmentTime: Number(e.target.value) }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Max Waiting Time * (minutes)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.manualDiseaseData.maxWaitingTime}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            manualDiseaseData: { ...prev.manualDiseaseData, maxWaitingTime: Number(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}