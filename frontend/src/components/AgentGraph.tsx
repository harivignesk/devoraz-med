import React, { useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'patient', position: { x: 50, y: 50 }, data: { label: 'Patient Agent' } },
  { id: 'priority', position: { x: 50, y: 150 }, data: { label: 'Priority Agent' } },
  { id: 'doctor', position: { x: 50, y: 250 }, data: { label: 'Doctor Agent' } },
  { id: 'nurse', position: { x: 50, y: 350 }, data: { label: 'Nurse Agent' } },
  { id: 'icu', position: { x: 350, y: 50 }, data: { label: 'ICU Agent' } },
  { id: 'or', position: { x: 350, y: 150 }, data: { label: 'OR Agent' } },
  { id: 'equipment', position: { x: 350, y: 250 }, data: { label: 'Equipment Agent' } },
  { id: 'negotiation', position: { x: 350, y: 350 }, data: { label: 'Negotiation Agent' } },
  { id: 'explainability', position: { x: 200, y: 450 }, data: { label: 'Explainability Agent' } },
  { id: 'assignment', position: { x: 200, y: 550 }, data: { label: 'Assignment Agent' } }
];

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
  animated: true,
};

const initialEdges = [
  { id: 'e1', source: 'patient', target: 'priority' },
  { id: 'e2', source: 'priority', target: 'doctor' },
  { id: 'e3', source: 'doctor', target: 'nurse' },
  { id: 'e4', source: 'nurse', target: 'icu' },
  { id: 'e5', source: 'icu', target: 'or' },
  { id: 'e6', source: 'or', target: 'equipment' },
  { id: 'e7', source: 'equipment', target: 'negotiation' },
  { id: 'e8', source: 'negotiation', target: 'icu', label: 'Loop on Fail', animated: true, style: { stroke: '#ef4444' } },
  { id: 'e9', source: 'negotiation', target: 'explainability' },
  { id: 'e10', source: 'explainability', target: 'assignment' }
];

export function AgentGraph({ currentNode, logs }: { currentNode: string | null, logs: any[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        // If it's the current node, glow blue
        // If it was processed already, turn green. 
        // We can check logs to see if it was processed.
        const wasProcessed = logs.some(log => log.agent === n.id);
        const isActive = currentNode === n.id;
        
        let bgColor = '#ffffff';
        let borderColor = '#e2e8f0';
        let color = '#334155';
        let shadow = 'none';

        if (isActive) {
          bgColor = '#eff6ff';
          borderColor = '#3b82f6';
          color = '#1d4ed8';
          shadow = '0 0 15px rgba(59, 130, 246, 0.5)';
        } else if (wasProcessed) {
          bgColor = '#f0fdf4';
          borderColor = '#22c55e';
          color = '#15803d';
        }

        return {
          ...n,
          style: {
            background: bgColor,
            borderColor: borderColor,
            color: color,
            borderWidth: '2px',
            borderRadius: '8px',
            padding: '10px',
            fontWeight: 'bold',
            boxShadow: shadow,
            transition: 'all 0.3s ease'
          }
        };
      })
    );
  }, [currentNode, logs, setNodes]);

  return (
    <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        attributionPosition="bottom-left"
      >
        <Background gap={16} size={1} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}
