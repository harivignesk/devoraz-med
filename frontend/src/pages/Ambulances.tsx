import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ambulance as AmbulanceIcon, Plus, MapPin, Navigation, UserCheck } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface Ambulance {
  id: number;
  ambulance_number: string;
  vehicle_type: string;
  driver: string;
  status: string;
  latitude: number;
  longitude: number;
  assigned_case_id: number;
}

export function Ambulances() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        const response = await apiClient.get('/hospital-admin/ambulances');
        setAmbulances(response.data);
      } catch (error) {
        console.error("Failed to fetch ambulances", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAmbulances();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'occupied': return 'bg-red-100 text-red-700'; // En route/Dispatched
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Fleet Management</h2>
          <p className="text-slate-500">Track and dispatch emergency response vehicles.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ambulances.map((amb) => (
            <Card key={amb.id} className="shadow-sm border-slate-200 hover:shadow-md transition-all overflow-hidden relative">
              {/* Top accent line based on status */}
              <div className={`h-1 w-full absolute top-0 left-0 ${
                amb.status.toLowerCase() === 'available' ? 'bg-green-500' :
                amb.status.toLowerCase() === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              
              <CardHeader className="pb-3 pt-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${amb.status.toLowerCase() === 'available' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                      <AmbulanceIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{amb.ambulance_number}</CardTitle>
                      <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">
                        {amb.vehicle_type}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(amb.status)}`}>
                    {amb.status}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center text-sm">
                    <UserCheck className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-slate-500 mr-1">Driver:</span>
                    <span className="font-semibold text-slate-800">{amb.driver || 'Unassigned'}</span>
                  </div>
                  
                  {amb.assigned_case_id && (
                    <div className="flex items-center text-sm">
                      <Activity className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-slate-500 mr-1">Active Case:</span>
                      <span className="font-semibold text-slate-800">#{amb.assigned_case_id}</span>
                    </div>
                  )}
                </div>

                {/* GPS Simulation Box */}
                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-blue-50 transition-colors">
                   <div className="absolute opacity-10 right-[-10%] top-[-20%]">
                      <Navigation className="h-24 w-24 text-blue-600" />
                   </div>
                   <MapPin className="h-5 w-5 text-blue-600 mb-1 z-10" />
                   <span className="text-xs text-blue-800/70 font-semibold uppercase tracking-widest z-10">Live Location</span>
                   <div className="mt-1 font-mono text-sm font-medium text-blue-900 z-10 flex gap-2">
                     <span>{amb.latitude ? amb.latitude.toFixed(5) : '0.00000'}° N</span>
                     <span className="text-blue-300">|</span>
                     <span>{amb.longitude ? amb.longitude.toFixed(5) : '0.00000'}° E</span>
                   </div>
                   <Button variant="ghost" size="sm" className="h-6 text-xs mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 z-10 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                     View on Map
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {ambulances.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <AmbulanceIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No ambulances</h3>
              <p className="mt-1 text-sm text-slate-500">Add emergency vehicles to the fleet to track them here.</p>
              <div className="mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
