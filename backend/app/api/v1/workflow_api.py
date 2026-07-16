import json
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.workflow.graph import app_workflow
from app.db.database import get_db
from app.models.domain import Patient

router = APIRouter()

class EmergencyTriageData(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: str
    injury_type: str
    blood_loss: str
    consciousness: str
    breathing: str
    pain_level: int
    heart_rate: int

@router.post("/emergency")
def submit_emergency(data: EmergencyTriageData, db: Session = Depends(get_db)):
    # Serialize triage data into the disease and medical history fields
    triage_summary = f"Injury: {data.injury_type} | Blood Loss: {data.blood_loss} | Consciousness: {data.consciousness} | Breathing: {data.breathing} | Pain: {data.pain_level}/10 | HR: {data.heart_rate}bpm"
    
    new_patient = Patient(
        name=data.name,
        age=data.age,
        gender=data.gender,
        blood_group=data.blood_group,
        current_disease=data.injury_type,
        medical_history=triage_summary,
        status="Emergency",
        hospital_id=1 # Default hospital for demo
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return {"patient_id": new_patient.id, "message": "Emergency case registered"}

@router.get("/stream/{patient_id}")
async def stream_workflow(patient_id: int):
    """
    Executes the LangGraph workflow for the given patient ID
    and streams the state updates as Server-Sent Events (SSE).
    """
    
    async def event_generator():
        initial_state = {
            "patient_id": patient_id,
            "patient_data": {},
            "priority_score": 0,
            "priority_level": "",
            "required_resources": {},
            "doctor_candidates": [],
            "nurse_candidates": [],
            "icu_candidates": [],
            "or_candidates": [],
            "equipment_candidates": [],
            "selected_resources": {},
            "rejected_combinations": [],
            "explanation": "",
            "logs": [],
            "iteration": 0
        }
        
        # We use astream to stream the state after each node execution
        # app_workflow.astream returns tuples of (node_name, state_update)
        try:
            async for output in app_workflow.astream(initial_state):
                for node_name, state_update in output.items():
                    # Send an SSE message
                    # We extract the latest log to send to the frontend if available
                    logs = state_update.get("logs", [])
                    latest_log = logs[-1] if logs else None
                    
                    event_data = {
                        "node": node_name,
                        "state": state_update,
                        "latest_log": latest_log
                    }
                    
                    yield f"data: {json.dumps(event_data)}\n\n"
                    
                    # Small delay for frontend animation effect
                    await asyncio.sleep(1.5)
                    
            # Send final completion event
            yield f"data: {json.dumps({'node': 'END', 'status': 'complete'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
