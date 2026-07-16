import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Activity, Clock, Settings, X, Stethoscope, Bed, HeartPulse, UserCircle2, Syringe, Search, Filter } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  contact_number: string;
  emergency_contact: string;
  address: string;
  medical_history: string;
  current_disease: string;
  allergies: string;
  insurance: string;
  ward: string | null;
  status: string;
  admission_time: string;
  assigned_doctor_id: number | null;
  assigned_nurse_id: number | null;
}

interface Equipment {
  id: number;
  name: string;
  status: string;
  assigned_patient_id: number | null;
}

interface ICUBed {
  id: number;
  icu_number: string;
  status: string;
  assigned_patient_id: number | null;
  ventilator: boolean;
  cardiac_monitor: boolean;
}

interface OperatingRoom {
  id: number;
  room_number: string;
  status: string;
  assigned_surgeon_id: number | null;
  current_surgery: string | null;
}

interface Doctor {
  id: number;
  name: string;
  department_id: number;
}

interface Nurse {
  id: number;
  name: string;
}

export function Patients() {
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => (await apiClient.get('/patients')).data
  });

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ['equipment'],
    queryFn: async () => (await apiClient.get('/hospital-admin/equipment')).data.catch(() => [])
  });

  const { data: icuBeds = [] } = useQuery<ICUBed[]>({
    queryKey: ['icuBeds'],
    queryFn: async () => (await apiClient.get('/hospital-admin/icu-beds')).data.catch(() => [])
  });

  const { data: operatingRooms = [] } = useQuery<OperatingRoom[]>({
    queryKey: ['operatingRooms'],
    queryFn: async () => (await apiClient.get('/hospital-admin/operating-rooms')).data.catch(() => [])
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => (await apiClient.get('/doctors')).data
  });

  const { data: nurses = [] } = useQuery<Nurse[]>({
    queryKey: ['nurses'],
    queryFn: async () => (await apiClient.get('/nurses')).data
  });

  const assignEquipmentMutation = useMutation({
    mutationFn: async ({ eqId, patientId }: { eqId: number, patientId: number }) => {
      return apiClient.put(`/hospital-admin/equipment/${eqId}`, {
        status: 'Occupied',
        assigned_patient_id: patientId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsAssigning(false);
    }
  });

  const assignICUBedMutation = useMutation({
    mutationFn: async ({ bedId, patientId }: { bedId: number, patientId: number }) => {
      return apiClient.put(`/hospital-admin/icu-beds/${bedId}`, {
        status: 'Occupied',
        assigned_patient_id: patientId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icuBeds'] });
      setIsAssigning(false);
    }
  });
  
  const assignORMutation = useMutation({
    mutationFn: async ({ orId, patientName }: { orId: number, patientName: string }) => {
      return apiClient.put(`/hospital-admin/operating-rooms/${orId}`, {
        status: 'Occupied',
        current_surgery: `Surgery for ${patientName}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operatingRooms'] });
      setIsAssigning(false);
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Jane Doe',
    age: 45,
    gender: 'Female',
    blood_group: 'A+',
    contact_number: '555-0199',
    emergency_contact: '555-0198',
    address: '123 Main St, City',
    medical_history: 'None',
    current_disease: 'Fever',
    allergies: 'None',
    insurance: 'HealthCorp'
  });

  const addPatientMutation = useMutation({
    mutationFn: async (newPat: any) => {
      return await apiClient.post('/patients', newPat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowAddForm(false);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'age' ? Number(value) : value });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPatientMutation.mutate(formData);
  };

  const getPriorityBadge = (patient: Patient) => {
    const disease = (patient.current_disease || '').toLowerCase();
    const ward = (patient.ward || '').toLowerCase();
    
    if (patient.status === 'Discharged') return { label: 'Discharged', color: 'bg-slate-100 text-slate-700' };
    if (ward.includes('icu') || disease.includes('heart') || disease.includes('stroke') || disease.includes('burn') || disease.includes('arrest')) {
      return { label: 'Critical', color: 'bg-red-100 text-red-800' };
    }
    if (ward.includes('surgery') || disease.includes('fracture') || disease.includes('covid') || disease.includes('severe')) {
      return { label: 'Serious', color: 'bg-orange-100 text-orange-800' };
    }
    return { label: 'Stable', color: 'bg-green-100 text-green-800' };
  };

  const getDoctorName = (docId: number | null) => doctors.find(d => d.id === docId)?.name || 'Unassigned';
  const getNurseName = (nurseId: number | null) => nurses.find(n => n.id === nurseId)?.name || 'Unassigned';

  const activeEquipment = equipment.filter(eq => eq.assigned_patient_id === selectedPatient?.id);
  const activeICUBeds = icuBeds.filter(bed => bed.assigned_patient_id === selectedPatient?.id);
  const activeORs = operatingRooms.filter(or => (or.current_surgery || '').includes(selectedPatient?.name || ''));
  
  const availableEquipment = equipment.filter(eq => eq.status.toLowerCase() === 'available');
  const availableICUBeds = icuBeds.filter(bed => bed.status.toLowerCase() === 'available');
  const availableORs = operatingRooms.filter(or => or.status.toLowerCase() === 'available');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toString().includes(searchQuery) ||
    (p.current_disease || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Add Patient Modal */}
      {showAddForm && (
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 mt-10">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-xl flex items-center justify-between">
                Register New Patient
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleAddSubmit}>
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                    <input required type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Blood Group</label>
                  <select name="blood_group" value={formData.blood_group} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                    <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>Unknown</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Contact Number</label>
                  <input required name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Current Disease / Reason for Visit</label>
                  <input required name="current_disease" value={formData.current_disease} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                </div>
              </CardContent>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={addPatientMutation.isPending}>
                  {addPatientMutation.isPending ? 'Saving...' : 'Register Patient'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Patient Directory</h2>
          <p className="text-slate-500">View and manage all registered patients in a streamlined list.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Register Patient
          </Button>
        </div>
      </div>

      {/* Patient List View */}
      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        {isLoadingPatients ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold">Patient</th>
                  <th className="px-6 py-4 font-bold">Priority</th>
                  <th className="px-6 py-4 font-bold">Disease / Diagnosis</th>
                  <th className="px-6 py-4 font-bold">Ward</th>
                  <th className="px-6 py-4 font-bold">Attending Doctor</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const priority = getPriorityBadge(patient);
                  const docName = getDoctorName(patient.assigned_doctor_id);
                  
                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.name}&backgroundColor=e2e8f0`} alt={patient.name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{patient.name}</div>
                            <div className="text-xs text-slate-500">ID: #{patient.id} • {patient.age}y • {patient.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priority.color}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <Activity className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 truncate" title={patient.current_disease}>{patient.current_disease || 'Pending Diagnosis'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-600">{patient.ward || 'General Ward'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-600">{docName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-900">No patients found</p>
                      <p className="text-sm">Try adjusting your search query or register a new patient.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detailed Patient Popup */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedPatient.name}&backgroundColor=e2e8f0`} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    {selectedPatient.name}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getPriorityBadge(selectedPatient).color}`}>
                      {getPriorityBadge(selectedPatient).label}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600 font-medium">
                    <span>ID: #{selectedPatient.id}</span>
                    <span className="text-slate-300">|</span>
                    <span>{selectedPatient.age} yrs</span>
                    <span className="text-slate-300">|</span>
                    <span>{selectedPatient.gender}</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-red-500"><HeartPulse className="h-4 w-4"/> Blood: {selectedPatient.blood_group || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedPatient(null); setIsAssigning(false); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-slate-50/50">
              
              {/* Left Column: Info & Medical */}
              <div className="w-full lg:w-3/5 p-6 overflow-y-auto border-r border-slate-200">
                
                {/* Patient Information */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                     <UserCircle2 className="h-4 w-4 text-blue-500" /> Patient Information
                  </h4>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Contact Number</span>
                      <span className="font-medium text-slate-900">{selectedPatient.contact_number}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Emergency Contact</span>
                      <span className="font-medium text-slate-900">{selectedPatient.emergency_contact || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Address</span>
                      <span className="font-medium text-slate-900">{selectedPatient.address || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Insurance</span>
                      <span className="font-medium text-slate-900">{selectedPatient.insurance || 'Self Pay'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Admission Date</span>
                      <span className="font-medium text-slate-900">{new Date(selectedPatient.admission_time).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Details */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                     <Activity className="h-4 w-4 text-blue-500" /> Medical Details
                  </h4>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 text-sm">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Disease / Diagnosis</span>
                        <span className="font-bold text-slate-900 text-base">{selectedPatient.current_disease || 'Pending'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Ward Location</span>
                        <span className="font-bold text-slate-900 text-base">{selectedPatient.ward || 'General Ward'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Allergies</span>
                      <p className="font-medium text-red-600">{selectedPatient.allergies || 'No known allergies'}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Medical History</span>
                      <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 min-h-[60px]">
                        {selectedPatient.medical_history || 'No prior medical history recorded.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Doctor Information */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                     <Stethoscope className="h-4 w-4 text-blue-500" /> Medical Team
                  </h4>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <UserCircle2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase block">Assigned Doctor</span>
                        <span className="font-bold text-slate-900">{getDoctorName(selectedPatient.assigned_doctor_id)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <UserCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase block">Assigned Nurse</span>
                        <span className="font-bold text-slate-900">{getNurseName(selectedPatient.assigned_nurse_id)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Resources */}
              <div className="w-full lg:w-2/5 p-6 bg-white overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                     <Settings className="h-4 w-4 text-blue-500" /> Resources Used
                  </h4>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => setIsAssigning(!isAssigning)}
                    className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-sm"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Resource
                  </Button>
                </div>
                
                {/* Active Resources List */}
                <div className="space-y-3 mb-8">
                  {/* ICU Beds */}
                  {activeICUBeds.map(bed => (
                    <div key={`icu-${bed.id}`} className="flex justify-between items-center p-4 border border-blue-100 rounded-xl bg-blue-50/30 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-blue-100 text-blue-600 rounded-lg shadow-sm">
                          <Bed className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-sm">ICU Bed {bed.icu_number}</span>
                          <span className="text-xs text-slate-500">Resource ID: #{bed.id}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Allocated</span>
                    </div>
                  ))}
                  
                  {/* Equipment */}
                  {activeEquipment.map(eq => (
                    <div key={`eq-${eq.id}`} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg">
                          <Syringe className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-sm">{eq.name}</span>
                          <span className="text-xs text-slate-500">Resource ID: #{eq.id}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                  ))}

                  {/* ORs */}
                  {activeORs.map(or => (
                    <div key={`or-${or.id}`} className="flex justify-between items-center p-4 border border-orange-100 rounded-xl bg-orange-50/50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-orange-100 text-orange-600 rounded-lg shadow-sm">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-sm">Operating Room {or.room_number}</span>
                          <span className="text-xs text-slate-500">Resource ID: #{or.id}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-700 px-2 py-1 rounded-full">In Progress</span>
                    </div>
                  ))}

                  {activeICUBeds.length === 0 && activeEquipment.length === 0 && activeORs.length === 0 && (
                    <div className="p-8 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center">
                      <Settings className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-900 text-sm">No Active Resources</p>
                      <p className="text-xs text-slate-500 mt-1">This patient is currently not utilizing any trackable hospital resources.</p>
                    </div>
                  )}
                </div>
                
                {/* Assign Resource Panel */}
                {isAssigning && (
                  <div className="mt-4 p-5 border border-slate-200 bg-slate-50 rounded-xl shadow-inner animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-sm font-bold text-slate-800">Available Resources</h5>
                      <button onClick={() => setIsAssigning(false)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
                    </div>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {/* Available ICU Beds */}
                      {availableICUBeds.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">ICU Beds</p>
                          <div className="space-y-2">
                            {availableICUBeds.map(bed => (
                              <button 
                                key={`avail-icu-${bed.id}`}
                                onClick={() => assignICUBedMutation.mutate({ bedId: bed.id, patientId: selectedPatient.id })}
                                disabled={assignICUBedMutation.isPending}
                                className="w-full flex justify-between items-center p-3 text-left bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-lg transition-all"
                              >
                                <div>
                                  <span className="text-sm font-bold text-slate-700 block">ICU Bed {bed.icu_number}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Includes: {bed.ventilator ? 'Ventilator' : ''} {bed.cardiac_monitor ? 'Monitor' : ''}</span>
                                </div>
                                <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Available Equipment */}
                      {availableEquipment.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Medical Equipment</p>
                          <div className="space-y-2">
                            {availableEquipment.map(eq => (
                              <button 
                                key={`avail-eq-${eq.id}`}
                                onClick={() => assignEquipmentMutation.mutate({ eqId: eq.id, patientId: selectedPatient.id })}
                                disabled={assignEquipmentMutation.isPending}
                                className="w-full flex justify-between items-center p-3 text-left bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-lg transition-all"
                              >
                                <span className="text-sm font-bold text-slate-700">{eq.name}</span>
                                <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Available ORs */}
                      {availableORs.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Operating Theatres</p>
                          <div className="space-y-2">
                            {availableORs.map(or => (
                              <button 
                                key={`avail-or-${or.id}`}
                                onClick={() => assignORMutation.mutate({ orId: or.id, patientName: selectedPatient.name })}
                                disabled={assignORMutation.isPending}
                                className="w-full flex justify-between items-center p-3 text-left bg-white border border-slate-200 hover:border-orange-400 hover:shadow-sm rounded-lg transition-all"
                              >
                                <div>
                                  <span className="text-sm font-bold text-slate-700 block">OR {or.room_number}</span>
                                </div>
                                <Plus className="h-4 w-4 text-orange-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableICUBeds.length === 0 && availableEquipment.length === 0 && availableORs.length === 0 && (
                        <p className="text-sm text-slate-500 italic text-center py-4 bg-white rounded border border-slate-200">No resources available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
