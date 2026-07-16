import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, Clock, Activity, Users } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

interface EmergencyCase {
  id: number;
  patient_name: string;
  age: number;
  gender: string;
  condition: string;
  priority: string;
  arrival_time: string;
  status: string;
  emergency_notes: string;
}

export function Emergency() {
  const { data: emergencies = [], isLoading } = useQuery<EmergencyCase[]>({
    queryKey: ['emergencies'],
    queryFn: async () => {
      const response = await apiClient.get('/emergency');
      return response.data;
    }
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' };
      case 'serious':
      case 'medium':
        return { label: 'Serious', color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' };
      default:
        return { label: 'Stable', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' };
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Emergency Queue</h2>
          <p className="text-slate-500">Manage incoming emergency cases and triage priorities.</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 h-4 w-4" /> New Emergency Case
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {emergencies.map((caseItem) => {
            const priority = getPriorityBadge(caseItem.priority);
            return (
              <Card 
                key={caseItem.id} 
                className="shadow-sm border-slate-200 hover:shadow-md transition-all relative overflow-hidden bg-white"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${priority.dot}`}></div>
                
                <CardHeader className="pb-3 pl-6 pt-5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-red-50 border border-red-100 flex items-center justify-center shadow-sm shrink-0">
                         <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="overflow-hidden">
                        <CardTitle className="text-lg font-bold text-slate-900 truncate">{caseItem.patient_name}</CardTitle>
                        <p className="text-xs text-slate-500 font-medium">Case #{caseItem.id} • {caseItem.age} yrs • {caseItem.gender}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pl-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${priority.color}`}>
                      <span className={`h-2 w-2 rounded-full ${priority.dot}`}></span>
                      {priority.label}
                    </div>
                    <span className={`text-xs font-bold uppercase ${caseItem.status === 'Waiting' ? 'text-orange-600' : 'text-blue-600'}`}>
                      {caseItem.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-start text-sm">
                      <Activity className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Condition</span>
                        <span className="font-semibold text-slate-800 line-clamp-2">{caseItem.condition}</span>
                      </div>
                    </div>
                    <div className="flex items-start text-sm">
                      <Clock className="h-4 w-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Arrival Time</span>
                        <span className="text-slate-600">{formatTime(caseItem.arrival_time)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {emergencies.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No active emergencies</h3>
              <p className="mt-1 text-sm text-slate-500">The emergency queue is currently empty.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
