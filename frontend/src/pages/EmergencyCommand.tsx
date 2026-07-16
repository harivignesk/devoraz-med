import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Play, CheckCircle2, AlertTriangle, Info, Bot, Plus } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { AgentGraph } from '@/components/AgentGraph';

interface LogEntry {
  timestamp: string;
  agent: string;
  message: string;
  data: any;
}

export function EmergencyCommand() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalState, setFinalState] = useState<any>(null);
  
  // Triage Form State
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageData, setTriageData] = useState({
    name: '',
    age: 30,
    gender: 'Male',
    blood_group: 'O+',
    injury_type: 'Traumatic Brain Injury',
    blood_loss: 'None',
    consciousness: 'Alert',
    breathing: 'Normal',
    pain_level: 5,
    heart_rate: 80
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTriageData(prev => ({ ...prev, [name]: name === 'age' || name === 'pain_level' || name === 'heart_rate' ? Number(value) : value }));
  };

  const submitTriageForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/workflow/emergency', triageData);
      const patientId = response.data.patient_id;
      setShowTriageForm(false);
      startWorkflow(patientId);
    } catch (error) {
      console.error("Failed to submit emergency case:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startWorkflow = (patientId: number) => {
    setIsExecuting(true);
    setLogs([]);
    setFinalState(null);
    setCurrentNode('patient'); // Initial state

    const eventSource = new EventSource(`http://localhost:8000/api/v1/workflow/stream/${patientId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        console.error("Workflow error:", data.error);
        eventSource.close();
        setIsExecuting(false);
        return;
      }

      if (data.node === 'END') {
        eventSource.close();
        setIsExecuting(false);
        setCurrentNode(null);
        return;
      }

      setCurrentNode(data.node);
      
      if (data.state) {
        setFinalState(data.state);
        if (data.state.logs) {
           setLogs(data.state.logs);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
      setIsExecuting(false);
    };
  };

  const patientToDisplay = finalState?.patient_data || null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4 animate-in fade-in duration-500 relative">
      
      {/* Triage Modal Overlay */}
      {showTriageForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="text-red-500 h-6 w-6" /> New Emergency Triage
              </CardTitle>
            </CardHeader>
            <form onSubmit={submitTriageForm}>
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                  <input required name="name" value={triageData.name} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="e.g. John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                    <input required type="number" name="age" value={triageData.age} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                    <select name="gender" value={triageData.gender} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Blood Group</label>
                  <select name="blood_group" value={triageData.blood_group} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                    <option>O+</option><option>O-</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>Unknown</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Injury Type (Description)</label>
                  <input required name="injury_type" value={triageData.injury_type} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="e.g. Head Injury, Cardiac Arrest" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Blood Loss</label>
                  <select name="blood_loss" value={triageData.blood_loss} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                    <option>None</option><option>Minor</option><option>Moderate</option><option>Severe</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Consciousness</label>
                  <select name="consciousness" value={triageData.consciousness} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                    <option>Alert</option><option>Confused</option><option>Unresponsive</option><option>Unconscious</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Breathing</label>
                  <select name="breathing" value={triageData.breathing} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm bg-white">
                    <option>Normal</option><option>Fast</option><option>Labored</option><option>Absent</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Pain Level (1-10)</label>
                    <input required type="number" min="1" max="10" name="pain_level" value={triageData.pain_level} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Heart Rate</label>
                    <input required type="number" name="heart_rate" value={triageData.heart_rate} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded text-sm" />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setShowTriageForm(false)}>Cancel</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Ingesting...' : 'Ingest to LangGraph Workflow'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Emergency Command Center</h2>
          <p className="text-slate-500">Multi-Agent Resource Allocation Workflow Powered by LangGraph</p>
        </div>
        <Button 
          onClick={() => setShowTriageForm(true)} 
          disabled={isExecuting}
          className="bg-red-600 hover:bg-red-700 shadow-lg text-white font-bold px-6"
        >
          {isExecuting ? (
             <><Activity className="mr-2 h-5 w-5 animate-spin" /> Agents Negotiating...</>
          ) : (
             <><Plus className="mr-2 h-5 w-5" /> New Emergency Case</>
          )}
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        
        {/* LEFT COLUMN: Patient & Scenario */}
        <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto pr-2">
          <Card className="border-slate-200 shadow-sm shrink-0">
            <CardHeader className="bg-slate-50 pb-4 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="text-red-500 h-5 w-5" /> Target Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!patientToDisplay ? (
                 <div className="text-center py-8 text-slate-400 text-sm">Waiting for emergency intake...</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</span>
                    <p className="font-semibold text-slate-900">{patientToDisplay.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Disease</span>
                    <p className="font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-100">
                      {patientToDisplay.disease || patientToDisplay.current_disease}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Triage Data</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      {patientToDisplay.medical_history}
                    </p>
                  </div>
                  {finalState?.priority_level && (
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Determined Priority</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{finalState.priority_level}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Score: {finalState.priority_score}</span>
                      </div>
                    </div>
                  )}
                  {finalState?.required_resources && (
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Required Resources</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(finalState.required_resources).map(req => (
                          <span key={req} className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Log */}
          <Card className="border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
            <CardHeader className="bg-slate-50 pb-3 border-b border-slate-100 shrink-0">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="text-slate-500 h-4 w-4" /> Agent Event Log
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto flex-1 bg-slate-900 text-green-400 font-mono text-[11px] p-4">
              {logs.length === 0 ? (
                <span className="text-slate-500">Waiting for workflow execution...</span>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={i} className="border-b border-slate-800 pb-2 mb-2">
                      <div className="flex justify-between items-start mb-1">
                         <span className="text-blue-400 font-bold">[{log.agent}]</span>
                         <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN: React Flow Graph */}
        <div className="col-span-6 bg-white border border-slate-200 rounded-xl shadow-sm p-2 flex flex-col relative">
           <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
             <span className="text-xs font-bold text-slate-700">LangGraph Live Execution</span>
           </div>
           <AgentGraph currentNode={currentNode} logs={logs} />
        </div>

        {/* RIGHT COLUMN: Candidates & Selected */}
        <div className="col-span-3 flex flex-col space-y-4 overflow-y-auto pr-2">
          
          <Card className="border-slate-200 shadow-sm shrink-0 border-green-200">
            <CardHeader className="bg-green-50 pb-4 border-b border-green-100">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" /> Negotiated Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!finalState?.selected_resources || Object.keys(finalState.selected_resources).length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-6">Pending negotiation...</p>
              ) : (
                <div className="space-y-4">
                  {finalState.selected_resources.doctor && (
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-xs font-bold uppercase text-slate-500">Doctor</span>
                      <span className="text-sm font-semibold text-slate-900">{finalState.selected_resources.doctor.name}</span>
                    </div>
                  )}
                  {finalState.selected_resources.nurse && (
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-xs font-bold uppercase text-slate-500">Nurse</span>
                      <span className="text-sm font-semibold text-slate-900">{finalState.selected_resources.nurse.name}</span>
                    </div>
                  )}
                  {finalState.selected_resources.icu && (
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-xs font-bold uppercase text-slate-500">ICU Bed</span>
                      <span className="text-sm font-semibold text-slate-900">{finalState.selected_resources.icu.icu_number}</span>
                    </div>
                  )}
                  {finalState.selected_resources.or && (
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-xs font-bold uppercase text-slate-500">Theatre</span>
                      <span className="text-sm font-semibold text-slate-900">{finalState.selected_resources.or.room_number}</span>
                    </div>
                  )}
                  {finalState.selected_resources.equipment && finalState.selected_resources.equipment.map((eq: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-xs font-bold uppercase text-slate-500">Equipment</span>
                      <span className="text-sm font-semibold text-slate-900">{eq.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm shrink-0">
             <CardHeader className="bg-slate-50 pb-3 border-b border-slate-100">
                <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                  <Bot className="text-blue-500 h-4 w-4" /> AI Explainability
                </CardTitle>
             </CardHeader>
             <CardContent className="pt-4 text-sm text-slate-700 leading-relaxed min-h-[150px]">
                {finalState?.explanation ? (
                  <div className="whitespace-pre-line">{finalState.explanation}</div>
                ) : (
                  <span className="text-slate-400 italic flex items-center justify-center h-full">Waiting for explainability agent...</span>
                )}
             </CardContent>
          </Card>
          
          {finalState?.rejected_combinations && finalState.rejected_combinations.length > 0 && (
             <Card className="border-orange-200 shadow-sm shrink-0">
               <CardHeader className="bg-orange-50 pb-3 border-b border-orange-100">
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-4 w-4" /> Reallocation Loops
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-4 space-y-2">
                  {finalState.rejected_combinations.map((rej: any, i: number) => (
                    <div key={i} className="text-xs p-2 bg-white border border-orange-100 rounded text-orange-800">
                       <span className="font-bold">Failed ICU ID:</span> {rej.icu_id}
                    </div>
                  ))}
               </CardContent>
             </Card>
          )}

        </div>
      </div>
    </div>
  );
}
