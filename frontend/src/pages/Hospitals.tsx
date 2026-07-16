import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital as HospitalIcon, Plus, MapPin, Phone } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface Hospital {
  id: number;
  name: string;
  address: string;
  contact_number: string;
  type: string;
  status: string;
}

export function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await apiClient.get('/hospitals');
        setHospitals(response.data);
      } catch (error) {
        console.error("Failed to fetch hospitals", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Hospitals</h2>
          <p className="text-slate-500">Manage the hospital network across the region.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Hospital
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital) => (
            <Card key={hospital.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">{hospital.name}</CardTitle>
                  <div className="flex items-center text-sm text-slate-500">
                    <MapPin className="mr-1 h-3 w-3" />
                    {hospital.address.length > 30 ? hospital.address.substring(0, 30) + '...' : hospital.address}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${hospital.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {hospital.status}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-slate-500 mt-2">
                  <Phone className="mr-2 h-4 w-4" />
                  {hospital.contact_number}
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {hospital.type}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {hospitals.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <HospitalIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No hospitals</h3>
              <p className="mt-1 text-sm text-slate-500">Get started by creating a new hospital.</p>
              <div className="mt-6">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Hospital
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
