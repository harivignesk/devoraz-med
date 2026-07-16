import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, Plus, Phone, Calendar, CheckCircle2, XCircle, X, Users, Activity, Clock, Clock4, ShieldAlert, HeartPulse } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface Department {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  department_id: number;
  contact_number: string;
  availability: string;
  status: string;
  qualification: string;
  experience: number;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  current_disease: string;
  status: string;
  assigned_doctor_id: number | null;
}

export function Doctors() {
  const queryClient = useQueryClient();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const { data: doctors = [], isLoading: isLoadingDocs } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => (await apiClient.get('/doctors')).data
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => (await apiClient.get('/patients')).data
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/hospital-admin/departments')).data.catch(() => []) // Fallback in case endpoint is restricted
  });

  const updateDoctorMutation = useMutation({
    mutationFn: async ({ docId, updates }: { docId: number, updates: any }) => {
      return apiClient.put(`/doctors/${docId}`, updates);
    },
    onSuccess: (data, variables) => {
      // If status changed to Off Duty, invalidate all cascaded dependencies
      if (variables.updates.status === 'Off Duty' || variables.updates.availability === 'Off Duty') {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        queryClient.invalidateQueries({ queryKey: ['icuBeds'] });
        queryClient.invalidateQueries({ queryKey: ['operatingRooms'] });
      }
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      if (selectedDoctor && selectedDoctor.id === variables.docId) {
        setSelectedDoctor(prev => prev ? { ...prev, ...variables.updates } : null);
      }
    }
  });

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find((d: Department) => d.id === deptId);
    return dept ? dept.name : 'General';
  };

  // Group doctors by Department
  const groupedDoctors = doctors.reduce((acc, doctor) => {
    const deptName = getDepartmentName(doctor.department_id);
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(doctor);
    return acc;
  }, {} as Record<string, Doctor[]>);

  const getDoctorPatients = (docId: number) => patients.filter(p => p.assigned_doctor_id === docId);

  const getStatusDisplay = (status: string, availability: string) => {
    const combined = `${status} ${availability}`.toLowerCase();
    if (combined.includes('surgery')) return { icon: <HeartPulse className="h-4 w-4 text-yellow-500" />, label: 'In Surgery', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' };
    if (combined.includes('off duty') || combined.includes('inactive')) return { icon: <Clock4 className="h-4 w-4 text-slate-500" />, label: 'Off Duty', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' };
    if (combined.includes('busy')) return { icon: <ShieldAlert className="h-4 w-4 text-red-500" />, label: 'Busy', color: 'bg-red-100 text-red-700', border: 'border-red-200' };
    return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Available', color: 'bg-green-100 text-green-700', border: 'border-green-200' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Doctors</h2>
          <p className="text-slate-500">Manage medical staff, workload, and availability.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {isLoadingDocs ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedDoctors).map(([deptName, docs]) => (
            <div key={deptName} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h3 className="text-xl font-semibold text-slate-800">{deptName}</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {docs.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {docs.map((doctor) => {
                  const statusInfo = getStatusDisplay(doctor.status, doctor.availability);
                  const patientCount = getDoctorPatients(doctor.id).length;
                  
                  return (
                    <Card 
                      key={doctor.id} 
                      className={`shadow-sm transition-all flex flex-col relative overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 ${statusInfo.label === 'Off Duty' ? 'opacity-75 bg-slate-50' : 'bg-white'}`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${statusInfo.color.split(' ')[0].replace('100', '500')}`}></div>
                      
                      <CardHeader className="pb-2 pl-6">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4 items-center">
                            {/* Avatar Placeholder */}
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center">
                               <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${doctor.name}&backgroundColor=e2e8f0`} alt="Avatar" className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold text-slate-900">{doctor.name}</CardTitle>
                              <p className="text-xs text-slate-500 font-medium">{doctor.specialization}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 mt-3 pl-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                             <span className="text-xs text-slate-400 block uppercase font-semibold">Experience</span>
                             <span className="font-semibold text-slate-700">{doctor.experience} Yrs</span>
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
          {doctors.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <Stethoscope className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No doctors found</h3>
              <p className="mt-1 text-sm text-slate-500">Get started by adding a new doctor to the system.</p>
            </div>
          )}
        </div>
      )}

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-md flex items-center justify-center">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedDoctor.name}&backgroundColor=e2e8f0`} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedDoctor.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-medium text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-0.5 rounded-md">
                      {getDepartmentName(selectedDoctor.department_id)}
                    </span>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium text-slate-500">Change Status:</span>
                       <select 
                         className="text-xs font-semibold bg-white border border-slate-200 rounded px-2 py-1 shadow-sm focus:outline-none focus:border-blue-500"
                         value={selectedDoctor.status === 'Off Duty' ? 'Off Duty' : (selectedDoctor.availability === 'In Surgery' ? 'In Surgery' : selectedDoctor.status)}
                         onChange={(e) => {
                           const val = e.target.value;
                           if (val === 'Off Duty') updateDoctorMutation.mutate({ docId: selectedDoctor.id, updates: { status: 'Off Duty', availability: 'Off Duty' }});
                           else if (val === 'In Surgery') updateDoctorMutation.mutate({ docId: selectedDoctor.id, updates: { status: 'Active', availability: 'In Surgery' }});
                           else if (val === 'Busy') updateDoctorMutation.mutate({ docId: selectedDoctor.id, updates: { status: 'Active', availability: 'Busy' }});
                           else updateDoctorMutation.mutate({ docId: selectedDoctor.id, updates: { status: 'Active', availability: 'Available' }});
                         }}
                       >
                          <option value="Active">🟢 Available</option>
                          <option value="Busy">🔴 Busy</option>
                          <option value="In Surgery">🟡 In Surgery</option>
                          <option value="Off Duty">⚫ Off Duty</option>
                       </select>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoctor(null)}
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
                       <Users className="h-4 w-4 text-blue-500" /> Personal Info
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Qualifications</span>
                        <p className="text-slate-900 font-medium mt-0.5">{selectedDoctor.qualification}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Specialization</span>
                        <p className="text-slate-900 font-medium mt-0.5">{selectedDoctor.specialization}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Contact</span>
                        <p className="text-slate-900 font-medium mt-0.5">{selectedDoctor.contact_number}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Working Hours</span>
                        <p className="text-slate-900 font-medium mt-0.5">08:00 AM - 04:00 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Current Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Workload</span>
                        <span className="font-semibold text-slate-900">{getDoctorPatients(selectedDoctor.id).length} Patients</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Current Room</span>
                        <span className="font-semibold text-slate-900">Consultation Rm 4</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Assigned Nurse</span>
                        <span className="font-semibold text-slate-900">Nurse Sarah</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Patients and History */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
                       <Activity className="h-4 w-4 text-blue-500" /> Assigned Patients
                    </h4>
                    
                    {getDoctorPatients(selectedDoctor.id).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {getDoctorPatients(selectedDoctor.id).map(patient => (
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
                        <p className="text-sm text-slate-500 mt-1">This doctor currently has no patients assigned.</p>
                      </div>
                    )}
                  </div>

                  <div>
                     <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Recent Treatment History</h4>
                     <div className="space-y-3">
                        {/* Mock History Items */}
                        {[
                          { time: 'Today, 10:30 AM', action: 'Completed surgery in OR-1', patient: 'Patient #402' },
                          { time: 'Yesterday, 04:15 PM', action: 'Discharged patient', patient: 'Patient #128' },
                          { time: 'Yesterday, 02:00 PM', action: 'Prescribed ventilator support', patient: 'ICU Bed 04' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                             <div className="text-xs font-semibold text-slate-400 w-24 shrink-0">{item.time}</div>
                             <div>
                               <p className="text-sm font-medium text-slate-800">{item.action}</p>
                               <p className="text-xs text-blue-600 mt-0.5">{item.patient}</p>
                             </div>
                          </div>
                        ))}
                     </div>
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
