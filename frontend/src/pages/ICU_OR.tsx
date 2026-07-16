import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Plus, Bed, PenTool, CheckCircle, Clock, X, Users } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface ICUBed {
  id: number;
  icu_number: string;
  status: string;
  ventilator: boolean;
  cardiac_monitor: boolean;
  equipment: string;
  assigned_nurse_id: number;
  assigned_patient_id: number | null;
}

interface OperatingRoom {
  id: number;
  room_number: string;
  status: string;
  current_surgery: string;
  assigned_surgeon_id: number;
  expected_completion_time: string;
  available_equipment: string;
  assigned_patient_id?: number | null;
}

interface Patient {
  id: number;
  name: string;
  status: string;
}

export function ICU_OR() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'icu' | 'or'>('icu');
  
  // Modal states
  const [selectedIcu, setSelectedIcu] = useState<ICUBed | null>(null);
  const [selectedOr, setSelectedOr] = useState<OperatingRoom | null>(null);
  const [isAdmitting, setIsAdmitting] = useState(false);

  // Queries
  const { data: icuBeds = [], isLoading: loadingIcu } = useQuery<ICUBed[]>({
    queryKey: ['icuBeds'],
    queryFn: async () => (await apiClient.get('/hospital-admin/icu-beds')).data
  });

  const { data: operatingRooms = [], isLoading: loadingOr } = useQuery<OperatingRoom[]>({
    queryKey: ['operatingRooms'],
    queryFn: async () => (await apiClient.get('/hospital-admin/operating-rooms')).data
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => (await apiClient.get('/patients')).data
  });

  // Mutations
  const assignIcuMutation = useMutation({
    mutationFn: async ({ bedId, patientId }: { bedId: number, patientId: number }) => {
      return apiClient.put(`/hospital-admin/icu-beds/${bedId}`, {
        status: 'Occupied',
        assigned_patient_id: patientId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icuBeds'] });
      setIsAdmitting(false);
      setSelectedIcu(null); // Close modal on success
    }
  });

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'occupied': return 'bg-red-100 text-red-700';
      case 'reserved': return 'bg-blue-100 text-blue-700';
      case 'cleaning': return 'bg-yellow-100 text-yellow-700';
      case 'maintenance': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const unassignedPatients = patients.filter(p => p.status.toLowerCase() !== 'admitted');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Critical Care & Surgery</h2>
          <p className="text-slate-500">Manage ICU beds and Operating Rooms.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('icu')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'icu' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ICU Management
          </button>
          <button 
            onClick={() => setActiveTab('or')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'or' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Operating Rooms
          </button>
        </div>
      </div>

      {(loadingIcu || loadingOr) ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* ICU BEDS VIEW */}
          {activeTab === 'icu' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                <StatBadge label="Total ICU Beds" value={icuBeds.length} />
                <StatBadge label="Available" value={icuBeds.filter(b => b.status === 'Available').length} color="text-green-600" />
                <StatBadge label="Occupied" value={icuBeds.filter(b => b.status === 'Occupied').length} color="text-red-600" />
                <StatBadge label="Cleaning" value={icuBeds.filter(b => b.status === 'Cleaning').length} color="text-yellow-600" />
                <StatBadge label="Reserved" value={icuBeds.filter(b => b.status === 'Reserved').length} color="text-blue-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {icuBeds.map(bed => (
                  <Card 
                    key={bed.id} 
                    className="shadow-sm border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                    onClick={() => setSelectedIcu(bed)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Bed className="h-5 w-5 text-slate-400" />
                          <CardTitle className="text-lg">{bed.icu_number}</CardTitle>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bed.status)}`}>
                          {bed.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-slate-500 block text-xs">Assigned Patient</span>
                          <span className="font-medium text-slate-800">{bed.assigned_patient_id ? `Patient #${bed.assigned_patient_id}` : 'None'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-slate-500 block text-xs">Assigned Nurse</span>
                          <span className="font-medium text-slate-800">{bed.assigned_nurse_id ? `Nurse #${bed.assigned_nurse_id}` : 'None'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${bed.ventilator ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                          {bed.ventilator ? <CheckCircle className="h-3 w-3" /> : null} Ventilator
                        </div>
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${bed.cardiac_monitor ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                          {bed.cardiac_monitor ? <CheckCircle className="h-3 w-3" /> : null} Cardiac Monitor
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* OPERATING ROOMS VIEW */}
          {activeTab === 'or' && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                <StatBadge label="Total ORs" value={operatingRooms.length} />
                <StatBadge label="Available" value={operatingRooms.filter(r => r.status === 'Available').length} color="text-green-600" />
                <StatBadge label="In Surgery" value={operatingRooms.filter(r => r.status === 'Occupied').length} color="text-red-600" />
                <StatBadge label="Cleaning" value={operatingRooms.filter(r => r.status === 'Cleaning').length} color="text-yellow-600" />
                <StatBadge label="Maintenance" value={operatingRooms.filter(r => r.status === 'Maintenance').length} color="text-slate-600" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {operatingRooms.map(room => (
                  <Card 
                    key={room.id} 
                    className="shadow-sm border-slate-200 flex flex-row items-stretch cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                    onClick={() => setSelectedOr(room)}
                  >
                    <div className="w-1/3 bg-slate-50 border-r border-slate-100 p-4 flex flex-col justify-center items-center text-center">
                       <Activity className={`h-8 w-8 mb-2 ${room.status === 'Occupied' ? 'text-red-500' : 'text-slate-400'}`} />
                       <h3 className="font-bold text-lg text-slate-800">{room.room_number}</h3>
                       <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                          {room.status}
                        </div>
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Surgery</span>
                        <p className="font-medium text-slate-900 mt-0.5">{room.current_surgery || 'None scheduled'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Surgeon</span>
                          <p className="text-sm text-slate-800 mt-0.5">{room.assigned_surgeon_id ? `Surgeon #${room.assigned_surgeon_id}` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Completion</span>
                          <p className="text-sm text-slate-800 mt-0.5 flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-slate-400" />
                            {room.expected_completion_time ? new Date(room.expected_completion_time).toLocaleTimeString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                         <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center">
                           <PenTool className="h-3 w-3 mr-1" /> Equipment
                         </span>
                         <p className="text-xs text-slate-700 mt-1">{room.available_equipment || 'Standard Surgical Kit'}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ICU Bed Details Modal */}
      {selectedIcu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bed className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedIcu.icu_number}</h3>
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedIcu.status)}`}>
                    {selectedIcu.status}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedIcu(null); setIsAdmitting(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Admitted Patient / Admit Action */}
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admitted Patient</h4>
                
                {selectedIcu.assigned_patient_id ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-slate-900">
                      Patient #{selectedIcu.assigned_patient_id}
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 mb-3">No patient is currently admitted to this bed.</p>
                    <Button 
                      onClick={() => setIsAdmitting(!isAdmitting)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isAdmitting ? 'Cancel' : 'Admit Patient'}
                    </Button>
                    
                    {/* Admit Dropdown */}
                    {isAdmitting && (
                      <div className="mt-3 bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                        <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">
                          Select from unassigned:
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {unassignedPatients.length > 0 ? unassignedPatients.map(p => (
                            <button
                              key={p.id}
                              onClick={() => assignIcuMutation.mutate({ bedId: selectedIcu.id, patientId: p.id })}
                              disabled={assignIcuMutation.isPending}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors"
                            >
                              <span className="font-medium text-slate-700">{p.name}</span>
                              <span className="text-xs text-slate-400 ml-2">ID: {p.id}</span>
                            </button>
                          )) : (
                            <div className="p-3 text-sm text-center text-slate-500">No available patients</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resources</h4>
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                      <span className="font-medium text-slate-700 text-sm">Ventilator Support</span>
                      {selectedIcu.ventilator ? <CheckCircle className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-slate-300" />}
                    </div>
                    <div className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                      <span className="font-medium text-slate-700 text-sm">Cardiac Monitor</span>
                      {selectedIcu.cardiac_monitor ? <CheckCircle className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-slate-300" />}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operating Room Details Modal */}
      {selectedOr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedOr.room_number}</h3>
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedOr.status)}`}>
                    {selectedOr.status}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedOr(null); setIsAdmitting(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-4">
                 <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheduled Surgery</h4>
                   <p className="font-semibold text-slate-900">{selectedOr.current_surgery || 'None'}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Surgeon</h4>
                     <p className="font-medium text-slate-800">{selectedOr.assigned_surgeon_id ? `Doctor #${selectedOr.assigned_surgeon_id}` : 'N/A'}</p>
                   </div>
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Est. End</h4>
                     <p className="font-medium text-slate-800 flex items-center">
                       <Clock className="h-3 w-3 mr-1 text-slate-400" />
                       {selectedOr.expected_completion_time ? new Date(selectedOr.expected_completion_time).toLocaleTimeString() : '--:--'}
                     </p>
                   </div>
                 </div>
               </div>

               <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Equipment</h4>
                 <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm text-sm text-slate-700">
                   {selectedOr.available_equipment || 'No specific equipment listed.'}
                 </div>
               </div>

               <div className="pt-4 flex gap-3">
                 <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Manage Room</Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color = "text-slate-800" }: { label: string, value: number, color?: string }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-2xl font-bold mt-1 ${color}`}>{value}</span>
    </div>
  );
}
