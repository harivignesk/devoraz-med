import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ambulance as AmbulanceIcon, Plus, MapPin, Navigation, UserCheck, Activity } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Sub-component to handle map centering and panning dynamically
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Helper to create custom colored Leaflet icons using Lucide/SVG designs
const createAmbulanceIcon = (status: string) => {
  const color = status.toLowerCase() === 'available' ? '#22c55e' : status.toLowerCase() === 'occupied' ? '#ef4444' : '#f59e0b';
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color}; 
        color: white; 
        padding: 8px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        width: 36px;
        height: 36px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
          <path d="M19 18H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10l4 4v5a2 2 0 0 1-2 2z"></path>
          <circle cx="7.5" cy="15.5" r="2.5"></circle>
          <circle cx="16.5" cy="15.5" r="2.5"></circle>
          <path d="M12 9v4"></path>
          <path d="M10 11h4"></path>
        </svg>
      </div>
    `,
    className: 'custom-ambulance-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export function Ambulances() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.04, 80.22]);
  const [mapZoom, setMapZoom] = useState(11);

  useEffect(() => {
    const fetchAmbulances = async () => {
      try {
        const response = await apiClient.get('/hospital-admin/ambulances');
        setAmbulances(response.data);
        
        // Center the map on the first ambulance found with coordinates
        const firstWithCoords = response.data.find((a: Ambulance) => a.latitude && a.longitude);
        if (firstWithCoords) {
          setMapCenter([firstWithCoords.latitude, firstWithCoords.longitude]);
        }
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
      case 'occupied': return 'bg-red-100 text-red-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleFocusAmbulance = (amb: Ambulance) => {
    if (amb.latitude && amb.longitude) {
      setMapCenter([amb.latitude, amb.longitude]);
      setMapZoom(14);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Fleet Management</h2>
          <p className="text-slate-500">Track and dispatch emergency response vehicles.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Fleet List */}
          <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
            {ambulances.map((amb) => (
              <Card 
                key={amb.id} 
                className="shadow-sm border-slate-200 hover:shadow-md transition-all overflow-hidden relative cursor-pointer group"
                onClick={() => handleFocusAmbulance(amb)}
              >
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

                  {/* GPS Box (Clicking card centers map) */}
                  <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-3 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-blue-50 transition-colors">
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
                     <span className="text-xs text-blue-600 font-semibold mt-2 group-hover:underline">
                       Focus on Map
                     </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {ambulances.length === 0 && (
              <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <AmbulanceIcon className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No ambulances</h3>
                <p className="mt-1 text-sm text-slate-500">No emergency vehicles are currently tracked in the fleet.</p>
              </div>
            )}
          </div>

          {/* Right Side: Map Viewer */}
          <div className="lg:col-span-2 h-[calc(100vh-220px)] min-h-[450px]">
            <Card className="h-full shadow-sm border-slate-200 overflow-hidden flex flex-col relative z-0">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-500 animate-pulse" />
                  Live Fleet Tracking Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative z-0 h-full">
                <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                  <ChangeView center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {ambulances.map((amb) => (
                    amb.latitude && amb.longitude && (
                      <Marker 
                        key={amb.id} 
                        position={[amb.latitude, amb.longitude]} 
                        icon={createAmbulanceIcon(amb.status)}
                      >
                        <Popup>
                          <div className="p-1.5 space-y-1 font-sans">
                            <div className="font-bold text-slate-800 text-sm">{amb.ambulance_number}</div>
                            <div className="text-xs text-slate-500"><span className="font-semibold">Type:</span> {amb.vehicle_type}</div>
                            <div className="text-xs text-slate-500"><span className="font-semibold">Driver:</span> {amb.driver}</div>
                            <div className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100">
                              {amb.status}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
