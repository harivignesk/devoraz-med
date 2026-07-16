import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus, User, Calendar, MapPin, Activity, HeartPulse, Stethoscope, AlertTriangle, X, Info, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface Equipment {
  id: number;
  name: string;
  status: string;
  maintenance_date: string | null;
  current_location: string | null;
  assigned_patient_id: number | null;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  current_disease: string;
  status: string;
  ward: string | null;
}

export function Equipment() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [allocationModalEq, setAllocationModalEq] = useState<Equipment | null>(null);

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: async () => {
      const response = await apiClient.get('/hospital-admin/equipment');
      return response.data;
    }
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await apiClient.get('/patients');
      return response.data;
    }
  });

  const [formData, setFormData] = useState({
    name: 'Ventilator V-100',
    status: 'Available',
    current_location: 'Storage Room A'
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (newEq: any) => {
      return await apiClient.post('/hospital-admin/equipment', newEq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowAddForm(false);
    }
  });

  const assignEquipmentMutation = useMutation({
    mutationFn: async ({ eqId, patientId }: { eqId: number, patientId: number }) => {
      return await apiClient.put(`/hospital-admin/equipment/${eqId}`, {
        status: 'Occupied',
        assigned_patient_id: patientId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setAllocationModalEq(null);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEquipmentMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase() === 'available') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full uppercase tracking-wider">Vacant</span>;
    } else if (status.toLowerCase() === 'occupied') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider">Occupied</span>;
    } else if (status.toLowerCase() === 'maintenance') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full uppercase tracking-wider">Maintenance</span>;
    } else {
      return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('ventilator') || lower.includes('oxygen')) return <Activity className="h-5 w-5" />;
    if (lower.includes('monitor') || lower.includes('ecg')) return <HeartPulse className="h-5 w-5" />;
    if (lower.includes('defibrillator')) return <AlertTriangle className="h-5 w-5" />;
    return <Stethoscope className="h-5 w-5" />;
  };

  // Smart Priority Algorithm
  const calculatePatientScore = (patient: Patient, eqName: string) => {
    let score = 0;
    const reasons: string[] = [];
    const disease = (patient.current_disease || '').toLowerCase();
    const ward = (patient.ward || '').toLowerCase();
    const eq = eqName.toLowerCase();

    // Base Priority (Critical = 50, Serious = 30, Stable = 10, Discharged = 0)
    if (patient.status === 'Discharged') return { score: 0, reasons: [] };
    
    if (ward.includes('icu') || disease.includes('heart') || disease.includes('stroke') || disease.includes('burn') || disease.includes('arrest') || disease.includes('sepsis')) {
      score += 50;
      reasons.push('+50 pts (Critical Condition/ICU)');
    } else if (ward.includes('surgery') || disease.includes('fracture') || disease.includes('covid') || disease.includes('severe') || disease.includes('pneumonia')) {
      score += 30;
      reasons.push('+30 pts (Serious Condition)');
    } else {
      score += 10;
      reasons.push('+10 pts (Stable Condition)');
    }

    // Equipment Match Synergy
    if (eq.includes('ventilator') || eq.includes('oxygen')) {
      if (disease.includes('asthma') || disease.includes('covid') || disease.includes('pneumonia') || disease.includes('pneumothorax')) {
        score += 40;
        reasons.push('+40 pts (Respiratory Illness Match)');
      }
      if (disease.includes('arrest')) {
        score += 30;
        reasons.push('+30 pts (Cardiac Arrest Risk)');
      }
    }
    if (eq.includes('monitor') || eq.includes('ecg')) {
      if (disease.includes('heart') || disease.includes('arrest') || disease.includes('stroke') || disease.includes('hypertension')) {
        score += 40;
        reasons.push('+40 pts (Cardiovascular Illness Match)');
      }
    }
    if (eq.includes('defibrillator')) {
      if (disease.includes('arrest') || disease.includes('heart')) {
        score += 50;
        reasons.push('+50 pts (High Cardiac Risk)');
      }
    }
    if (eq.includes('ultrasound')) {
      if (disease.includes('appendicitis') || disease.includes('kidney')) {
        score += 30;
        reasons.push('+30 pts (Localized Pain/Organ Match)');
      }
    }

    return { score, reasons };
  };

  const getScoredPatients = (eqName: string) => {
    return patients
      .map(p => {
        const result = calculatePatientScore(p, eqName);
        return { patient: p, score: result.score, reasons: result.reasons };
      })
      .filter(item => item.score > 0) // Hide discharged or irrelevant patients
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5
  };

  const generateRationale = (topPatient: any, runnerUp: any, eqName: string) => {
    if (!topPatient) return "No suitable patients found for this resource.";
    let rationale = `The algorithm prioritized ${topPatient.patient.name} due to their ${topPatient.score >= 70 ? 'Critical' : 'Serious'} condition (${topPatient.patient.current_disease}), yielding a Need Score of ${topPatient.score}.`;
    
    const isRespiratory = eqName.toLowerCase().includes('ventilator') || eqName.toLowerCase().includes('oxygen');
    const isCardiac = eqName.toLowerCase().includes('monitor') || eqName.toLowerCase().includes('ecg');
    
    if (isRespiratory && topPatient.score > 50) {
      rationale += ` Their respiratory condition strongly synergizes with the need for a ${eqName}.`;
    } else if (isCardiac && topPatient.score > 50) {
      rationale += ` Their cardiac condition strongly synergizes with the need for a ${eqName}.`;
    }

    if (runnerUp) {
      rationale += ` This significantly outranks the next candidate, ${runnerUp.patient.name} (Score: ${runnerUp.score}).`;
    }

    return rationale;
  };

  // Group equipment by type
  const ventilators = equipment.filter(e => e.name.toLowerCase().includes('ventilator'));
  const monitors = equipment.filter(e => e.name.toLowerCase().includes('monitor') || e.name.toLowerCase().includes('ecg'));
  const others = equipment.filter(e => !e.name.toLowerCase().includes('ventilator') && !e.name.toLowerCase().includes('monitor') && !e.name.toLowerCase().includes('ecg'));

  const renderEquipmentGroup = (title: string, items: Equipment[], colorClass: string) => (
    <div className="mb-8">
      <h3 className={`text-lg font-bold mb-4 ${colorClass}`}>{title} ({items.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className={`shadow-sm border-slate-200 transition-all ${item.status.toLowerCase() === 'available' ? 'hover:border-blue-400 hover:shadow-md cursor-pointer group relative overflow-hidden' : ''}`}
            onClick={() => {
              if (item.status.toLowerCase() === 'available') {
                setAllocationModalEq(item);
              }
            }}
          >
            {item.status.toLowerCase() === 'available' && (
              <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 transition-colors pointer-events-none z-0"></div>
            )}
            <CardHeader className="pb-3 border-b border-slate-100 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.status.toLowerCase() === 'available' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    {getIcon(item.name)}
                  </div>
                  <div>
                    <CardTitle className="text-md">{item.name}</CardTitle>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: EQ-{item.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 relative z-10">
              {item.status.toLowerCase() === 'occupied' && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
                  <User className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-0.5">Assigned To</p>
                    <p className="text-sm font-medium text-slate-800">Patient #{item.assigned_patient_id}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm text-slate-800 mt-0.5 truncate max-w-[100px]" title={item.current_location || 'Storage'}>{item.current_location || 'Storage'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maintenance</p>
                    <p className="text-sm text-slate-800 mt-0.5">
                      {item.maintenance_date ? new Date(item.maintenance_date).toLocaleDateString() : 'Up to date'}
                    </p>
                  </div>
                </div>
              </div>
              
              {item.status.toLowerCase() === 'available' ? (
                <div className="pt-2">
                  <Button variant="default" className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700">Auto-Assign Resource</Button>
                </div>
              ) : (
                <div className="pt-2">
                  <Button variant="outline" className="w-full text-xs h-8">View History</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Add Equipment Modal */}
      {showAddForm && (
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-12">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle>Add New Equipment</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Equipment Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="e.g. Ventilator V-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                    <option>Available</option>
                    <option>Occupied</option>
                    <option>Maintenance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
                  <input required name="current_location" value={formData.current_location} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="e.g. ICU Wing A" />
                </div>
              </CardContent>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={addEquipmentMutation.isPending}>
                  {addEquipmentMutation.isPending ? 'Saving...' : 'Save Equipment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Smart Allocation Modal */}
      {allocationModalEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start p-6 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Smart Allocation: {allocationModalEq.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Intelligent Priority Ranking for Eq. ID: #{allocationModalEq.id}</p>
              </div>
              <button onClick={() => setAllocationModalEq(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white">
              {(() => {
                const scoredList = getScoredPatients(allocationModalEq.name);
                const topCandidate = scoredList[0];
                const runnerUp = scoredList[1];
                const rationale = generateRationale(topCandidate, runnerUp, allocationModalEq.name);

                return (
                  <div className="space-y-6">
                    {/* Rationale Banner */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3 shadow-sm">
                      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-blue-900 mb-1">Agent Negotiation Rationale</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">{rationale}</p>
                      </div>
                    </div>

                    {/* Ranked List */}
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Patient Priority Queue</h4>
                      
                      {scoredList.length > 0 ? (
                        <div className="space-y-3">
                          {scoredList.map((item, index) => (
                            <div key={item.patient.id} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${index === 0 ? 'border-blue-400 bg-blue-50/30 shadow-md ring-1 ring-blue-400' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                                  #{index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-2">
                                    {item.patient.name}
                                    {index === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold rounded-full">Top Match</span>}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{item.patient.current_disease}</span>
                                      <span>•</span>
                                      <span className="font-bold text-slate-700">Score: {item.score} pts</span>
                                    </div>
                                    {item.reasons && item.reasons.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {item.reasons.map((r, i) => (
                                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[10px] leading-none whitespace-nowrap">
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                onClick={() => assignEquipmentMutation.mutate({ eqId: allocationModalEq.id, patientId: item.patient.id })}
                                disabled={assignEquipmentMutation.isPending}
                                className={index === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
                              >
                                {assignEquipmentMutation.isPending ? 'Assigning...' : 'Assign'}
                                {index === 0 && !assignEquipmentMutation.isPending && <CheckCircle2 className="ml-2 h-4 w-4" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                          <AlertTriangle className="h-10 w-10 text-orange-400 mx-auto mb-3" />
                          <p className="font-bold text-slate-700">No Eligible Patients</p>
                          <p className="text-sm text-slate-500 mt-1">There are no admitted patients who currently need this resource.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Equipment Stock</h2>
          <p className="text-slate-500">Manage and track hospital medical equipment inventory.</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {ventilators.length > 0 && renderEquipmentGroup("Ventilators & Respiratory", ventilators, "text-blue-800")}
          {monitors.length > 0 && renderEquipmentGroup("Cardiac & Vitals Monitors", monitors, "text-red-800")}
          {others.length > 0 && renderEquipmentGroup("General Medical Equipment", others, "text-slate-800")}
          
          {equipment.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <Settings className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No equipment found</h3>
              <p className="mt-1 text-sm text-slate-500">Your inventory is currently empty.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
