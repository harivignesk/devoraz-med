import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getHospitalsMap } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Hospital, Users, Stethoscope, Ambulance, BedDouble } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  const { data: mapData, isLoading: mapLoading } = useQuery({
    queryKey: ['hospitalsMap'],
    queryFn: getHospitalsMap,
  });

  if (statsLoading || mapLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading dashboard statistics. Please try again.
      </div>
    );
  }

  const chartData = [
    { name: 'ICU', total: stats?.total_icu_beds, occupied: stats?.icu_occupied },
    { name: 'Operating Rooms', total: stats?.total_operating_rooms, occupied: stats?.or_occupied },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Hospitals" value={stats?.total_hospitals} icon={<Hospital />} trend="+2 this month" />
        <KPICard title="Active Doctors" value={stats?.total_doctors} icon={<Stethoscope />} />
        <KPICard title="Total Patients" value={stats?.total_patients} icon={<Users />} trend="15% increase" />
        <KPICard title="Emergency Cases" value={stats?.emergency_cases} icon={<Ambulance />} alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Capacity" />
                <Bar dataKey="occupied" fill="#2563eb" radius={[4, 4, 0, 0]} name="Currently Occupied" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Map */}
        <Card className="shadow-sm border-slate-200 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Hospital Network</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 h-[300px] relative z-0">
             <MapContainer center={[13.04, 80.22]} zoom={11} style={{ height: '100%', width: '100%' }}>
               <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
               {mapData?.map((hospital: any) => (
                 <Marker key={hospital.id} position={[hospital.latitude, hospital.longitude]}>
                   <Popup>{hospital.name}</Popup>
                 </Marker>
               ))}
             </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, trend, alert }: { title: string, value: any, icon: React.ReactNode, trend?: string, alert?: boolean }) {
  return (
    <Card className={`shadow-sm border-slate-200 transition-all hover:shadow-md ${alert ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className={`p-2 rounded-lg ${alert ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className={`text-3xl font-bold tracking-tight ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</h3>
          {trend && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
