import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Phone, CheckCircle2, X, Users, Activity, Clock, Clock4, ShieldAlert, HeartPulse, UserCircle2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface Department {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  name: string;
}

interface Nurse {
  id: number;
  name: string;
  qualification: string;
  department_id: number;
  contact_number: string;
  shift: string;
  availability: string;
  status: string;
  experience: number;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  current_disease: string;
  status: string;
  assigned_nurse_id: number | null;
  assigned_doctor_id: number | null;
  ward: string | null;
}

interface ICUBed {
  id: number;
  icu_number: string;
  assigned_nurse_id: number | null;
}

export function Nurses() {
  const queryClient = useQueryClient();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);

  const { data: nurses = [], isLoading: isLoadingNurses } = useQuery<Nurse[]>({
    queryKey: ['nurses'],
    queryFn: async () => (await apiClient.get('/nurses')).data
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => (await apiClient.get('/patients')).data
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => (await apiClient.get('/doctors')).data
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/hospital-admin/departments')).data.catch(() => [])
  });
  
  const { data: icuBeds = [] } = useQuery<ICUBed[]>({
    queryKey: ['icuBeds'],
    queryFn: async () => (await apiClient.get('/hospital-admin/icu-beds')).data.catch(() => [])
  });

  const updateNurseMutation = useMutation({
    mutationFn: async ({ nurseId, updates }: { nurseId: number, updates: any }) => {
      return apiClient.put(`/nurses/${nurseId}`, updates);
    },
    onSuccess: (data, variables) => {
      if (variables.updates.status === 'Off Duty' || variables.updates.availability === 'Off Duty') {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        queryClient.invalidateQueries({ queryKey: ['icuBeds'] });
      }
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
      if (selectedNurse && selectedNurse.id === variables.nurseId) {
        setSelectedNurse(prev => prev ? { ...prev, ...variables.updates } : null);
      }
    }
  });

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find((d: Department) => d.id === deptId);
    return dept ? dept.name : 'General';
  };

  const mapToNurseRole = (deptName: string, qual: string): string => {
    const d = deptName.toLowerCase();
    const q = qual.toLowerCase();
    if (d.includes('icu') || q.includes('icu')) return 'ICU Nurses';
    if (d.includes('surgery') || d.includes('operation') || q.includes('ot')) return 'OT Nurses';
    if (d.includes('emergency') || d.includes('trauma')) return 'Emergency Nurses';
    if (d.includes('pediatric')) return 'Pediatric Nurses';
    if (d.includes('ward') || d.includes('general')) return 'Ward Nurses';
    return 'General Staff Nurses';
  };

  const groupedNurses = nurses.reduce((acc, nurse) => {
    const deptName = getDepartmentName(nurse.department_id);
    const role = mapToNurseRole(deptName, nurse.qualification);
    if (!acc[role]) acc[role] = [];
    acc[role].push(nurse);
    return acc;
  }, {} as Record<string, Nurse[]>);

  const getNursePatients = (nurseId: number) => patients.filter(p => p.assigned_nurse_id === nurseId);
  const getNurseICUBeds = (nurseId: number) => icuBeds.filter(b => b.assigned_nurse_id === nurseId);

  const getStatusDisplay = (status: string, availability: string) => {
    const combined = `${status} ${availability}`.toLowerCase();
    if (combined.includes('off duty') || combined.includes('inactive')) return { icon: <Clock4 className="h-4 w-4 text-slate-500" />, label: 'Off Duty', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' };
    if (combined.includes('busy')) return { icon: <ShieldAlert className="h-4 w-4 text-red-500" />, label: 'Busy', color: 'bg-red-100 text-red-700', border: 'border-red-200' };
    if (combined.includes('shift')) return { icon: <HeartPulse className="h-4 w-4 text-yellow-500" />, label: 'On Shift', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' };
    return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Available', color: 'bg-green-100 text-green-700', border: 'border-green-200' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Nurses</h2>
          <p className="text-slate-500">Manage nursing staff, shifts, and ward assignments.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Nurse
        </Button>
      </div>

      {isLoadingNurses ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedNurses).map(([roleName, nrsList]) => (
            <div key={roleName} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h3 className="text-xl font-semibold text-slate-800">{roleName}</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {nrsList.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {nrsList.map((nurse) => {
                  const statusInfo = getStatusDisplay(nurse.status, nurse.availability);
                  const patientCount = getNursePatients(nurse.id).length;
                  
                  return (
                    <Card 
                      key={nurse.id} 
                      className={`shadow-sm transition-all flex flex-col relative overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 ${statusInfo.label === 'Off Duty' ? 'opacity-75 bg-slate-50' : 'bg-white'}`}
                      onClick={() => setSelectedNurse(nurse)}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${statusInfo.color.split(' ')[0].replace('100', '500')}`}></div>
                      
                      <CardHeader className="pb-2 pl-6">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4 items-center">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center">
                               <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${nurse.name}&backgroundColor=e2e8f0`} alt="Avatar" className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold text-slate-900">{nurse.name}</CardTitle>
                              <p className="text-xs text-slate-500 font-medium">{roleName}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 mt-3 pl-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="text-xs text-slate-400 block uppercase font-semibold">Experience</span>
                             <span className="font-semibold text-slate-700">{nurse.experience || 2} Yrs</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="text-xs text-slate-400 block uppercase font-semibold">Patients</span>
                             <span className="font-semibold text-slate-700">{patientCount} Assigned</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} ${statusInfo.border}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-8">
                             View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {nurses.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <UserCircle2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No nurses found</h3>
              <p className="mt-1 text-sm text-slate-500">Get started by adding a new nurse to the system.</p>
            </div>
          )}
        </div>
      )}

      {/* Nurse Details Modal */}
      {selectedNurse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-md flex items-center justify-center">
                    <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${selectedNurse.name}&backgroundColor=e2e8f0`} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedNurse.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-medium text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-0.5 rounded-md">
                      {mapToNurseRole(getDepartmentName(selectedNurse.department_id), selectedNurse.qualification)}
                    </span>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium text-slate-500">Change Status:</span>
                       <select 
                         className="text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 shadow-sm focus:outline-none focus:border-blue-500"
                         value={selectedNurse.status === 'Off Duty' ? 'Off Duty' : (selectedNurse.availability === 'On Shift' ? 'On Shift' : selectedNurse.status)}
                         onChange={(e) => {
                           const val = e.target.value;
                           if (val === 'Off Duty') updateNurseMutation.mutate({ nurseId: selectedNurse.id, updates: { status: 'Off Duty', availability: 'Off Duty' }});
                           else if (val === 'On Shift') updateNurseMutation.mutate({ nurseId: selectedNurse.id, updates: { status: 'Active', availability: 'On Shift' }});
                           else if (val === 'Busy') updateNurseMutation.mutate({ nurseId: selectedNurse.id, updates: { status: 'Active', availability: 'Busy' }});
                           else updateNurseMutation.mutate({ nurseId: selectedNurse.id, updates: { status: 'Active', availability: 'Available' }});
                         }}
                       >
                          <option value="Active">🟢 Available</option>
                          <option value="Busy">🔴 Busy</option>
                          <option value="On Shift">🟡 On Shift</option>
                          <option value="Off Duty">⚫ Off Duty</option>
                       </select>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNurse(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors bg-white shadow-sm border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                       <Users className="h-4 w-4 text-blue-500" /> Personal Profile
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Qualifications</span>
                        <p className="text-slate-900 font-medium mt-0.5">{selectedNurse.qualification}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Department</span>
                        <p className="text-slate-900 font-medium mt-0.5">{getDepartmentName(selectedNurse.department_id)}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Contact</span>
                        <p className="text-slate-900 font-medium mt-0.5">{selectedNurse.contact_number}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Shift Timing</span>
                        <p className="text-slate-900 font-medium mt-0.5">{selectedNurse.shift} Shift</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Current Workload</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Assigned Ward</span>
                        <span className="font-semibold text-slate-900">{getNursePatients(selectedNurse.id)[0]?.ward || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">ICU Beds</span>
                        <span className="font-semibold text-slate-900">{getNurseICUBeds(selectedNurse.id).length > 0 ? getNurseICUBeds(selectedNurse.id).map(b => b.icu_number).join(', ') : 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Doctor Assisting</span>
                        <span className="font-semibold text-slate-900 truncate max-w-[120px]" title={
                          [...new Set(getNursePatients(selectedNurse.id).map(p => p.assigned_doctor_id).filter(id => id))]
                            .map(docId => doctors.find(d => d.id === docId)?.name)
                            .join(', ') || 'None'
                        }>
                          {[...new Set(getNursePatients(selectedNurse.id).map(p => p.assigned_doctor_id).filter(id => id))]
                            .map(docId => doctors.find(d => d.id === docId)?.name)
                            .join(', ') || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Patients and History */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                       <Activity className="h-4 w-4 text-blue-500" /> Current Patients
                    </h4>
                    
                    {getNursePatients(selectedNurse.id).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {getNursePatients(selectedNurse.id).map(patient => (
                          <div key={patient.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-bold text-slate-900">{patient.name}</h5>
                                  <p className="text-xs text-slate-500">{patient.age} yrs • {patient.gender}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${patient.status === 'Admitted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                   {patient.status}
                                </span>
                             </div>
                             <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-100 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 truncate" title={patient.current_disease}>{patient.current_disease || 'Pending Diagnosis'}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center">
                        <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h5 className="font-medium text-slate-900">No active patients</h5>
                        <p className="text-sm text-slate-500 mt-1">This nurse currently has no patients assigned to them.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
