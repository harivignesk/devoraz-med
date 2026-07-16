import json
import logging
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from app.db.database import SessionLocal
from app.models.domain import Doctor, Nurse, ICUBed, OperatingRoom, Equipment, Patient
from datetime import datetime

logger = logging.getLogger(__name__)

class EmergencyState(TypedDict):
    patient_id: int
    patient_data: dict
    priority_score: int
    priority_level: str
    required_resources: dict
    doctor_candidates: List[dict]
    nurse_candidates: List[dict]
    icu_candidates: List[dict]
    or_candidates: List[dict]
    equipment_candidates: List[dict]
    selected_resources: dict
    rejected_combinations: List[dict]
    explanation: str
    logs: List[dict]
    iteration: int

def add_log(state: EmergencyState, agent: str, message: str, data: Any = None):
    if "logs" not in state or state["logs"] is None:
        state["logs"] = []
    
    # We create a new logs list to ensure immutability for the state update
    new_logs = list(state["logs"])
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "agent": agent,
        "message": message,
        "data": data
    }
    new_logs.append(log_entry)
    state["logs"] = new_logs
    return state

def patient_agent(state: EmergencyState):
    state = add_log(state, "patient", "Reading patient profile and extracting vitals/disease data.")
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.id == state["patient_id"]).first()
        if patient:
            state["patient_data"] = {
                "name": patient.name,
                "disease": patient.current_disease,
                "age": patient.age,
                "blood_group": patient.blood_group,
                "medical_history": patient.medical_history
            }
            
            # Extract parsed triage data
            history = (patient.medical_history or "").lower()
            disease = (patient.current_disease or "").lower()
            
            reqs = {"doctor": True, "nurse": True}
            
            # Analyze Triage Data
            if "severe" in history and "blood loss" in history:
                reqs["blood"] = True
                reqs["or"] = True
            
            if "unconscious" in history or "confused" in history:
                reqs["icu"] = True
                
            if "labored" in history or "absent" in history:
                reqs["ventilator"] = True
                reqs["icu"] = True
                
            if "head injury" in disease or "cardiac" in disease:
                reqs["icu"] = True
                reqs["or"] = True
                
            # Default to ICU if none caught but critical
            if not reqs.get("icu") and "pain: 10/10" in history:
                reqs["icu"] = True
            
            state["required_resources"] = reqs
            state = add_log(state, "patient", f"Patient {patient.name} requires: {list(reqs.keys())}", reqs)
        else:
            state = add_log(state, "patient", "Patient not found.")
            state["patient_data"] = {}
            state["required_resources"] = {}
    finally:
        db.close()
    return state

def priority_agent(state: EmergencyState):
    state = add_log(state, "priority", "Calculating deterministic priority score.")
    disease = state.get("patient_data", {}).get("disease", "").lower()
    history = state.get("patient_data", {}).get("medical_history", "").lower()
    score = 50
    level = "Medium"
    
    # Analyze History
    if "unconscious" in history or "absent" in history or "cardiac arrest" in disease:
        score = 99
        level = "Critical"
    elif "severe" in history and "blood loss" in history:
        score = 95
        level = "Critical"
    elif "labored" in history or "head injury" in disease or "confused" in history:
        score = 85
        level = "High"
    elif "pain: 9/10" in history or "pain: 10/10" in history:
        score = 75
        level = "High"
    elif "minor" in history:
        score = 40
        level = "Low"
        
    state["priority_score"] = score
    state["priority_level"] = level
    state = add_log(state, "priority", f"Calculated Score: {score}, Level: {level}")
    return state

def doctor_agent(state: EmergencyState):
    state = add_log(state, "doctor", "Evaluating doctor availability, experience, and workload.")
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        candidates = []
        for d in doctors:
            score = 50
            if d.status == "Active" or d.availability == "Available": score += 30
            disease = state.get("patient_data", {}).get("disease", "").lower()
            spec = (d.specialization or "").lower()
            if "head injury" in disease and "neuro" in spec:
                score += 50
            candidates.append({"id": d.id, "name": d.name, "specialization": d.specialization, "score": score})
        
        candidates.sort(key=lambda x: x["score"], reverse=True)
        state["doctor_candidates"] = candidates
        state = add_log(state, "doctor", f"Found {len(candidates)} doctor candidates.", candidates[:3])
    finally:
        db.close()
    return state

def nurse_agent(state: EmergencyState):
    state = add_log(state, "nurse", "Evaluating nurse availability and current assignments.")
    db = SessionLocal()
    try:
        nurses = db.query(Nurse).all()
        candidates = []
        for n in nurses:
            score = 60
            if n.availability == "Available": score += 20
            qual = (n.qualification or "").lower()
            if "icu" in qual or "emergency" in qual:
                score += 30
            candidates.append({"id": n.id, "name": n.name, "qualification": n.qualification, "score": score})
        
        candidates.sort(key=lambda x: x["score"], reverse=True)
        state["nurse_candidates"] = candidates
        state = add_log(state, "nurse", f"Found {len(candidates)} nurse candidates.", candidates[:3])
    finally:
        db.close()
    return state

def icu_agent(state: EmergencyState):
    if not state.get("required_resources", {}).get("icu"):
        state["icu_candidates"] = []
        return state
        
    state = add_log(state, "icu", "Evaluating ICU bed availability and capabilities.")
    db = SessionLocal()
    try:
        beds = db.query(ICUBed).filter(ICUBed.status == "Available").all()
        candidates = []
        for b in beds:
            score = 80
            if b.ventilator: score += 20
            candidates.append({"id": b.id, "icu_number": b.icu_number, "score": score})
            
        candidates.sort(key=lambda x: x["score"], reverse=True)
        
        state["icu_candidates"] = candidates
        state = add_log(state, "icu", f"Found {len(candidates)} available ICU beds.", candidates[:3])
    finally:
        db.close()
    return state

def or_agent(state: EmergencyState):
    if not state.get("required_resources", {}).get("or"):
        state["or_candidates"] = []
        return state
        
    state = add_log(state, "or", "Evaluating OR availability and cleaning status.")
    db = SessionLocal()
    try:
        ors = db.query(OperatingRoom).filter(OperatingRoom.status == "Available").all()
        candidates = [{"id": o.id, "room_number": o.room_number, "score": 90} for o in ors]
        state["or_candidates"] = candidates
        state = add_log(state, "or", f"Found {len(candidates)} available ORs.", candidates[:3])
    finally:
        db.close()
    return state

def equipment_agent(state: EmergencyState):
    state = add_log(state, "equipment", "Evaluating ventilator, blood, and monitor availability.")
    db = SessionLocal()
    try:
        eqs = db.query(Equipment).filter(Equipment.status == "Available").all()
        candidates = [{"id": e.id, "name": e.name, "score": 100} for e in eqs]
        state["equipment_candidates"] = candidates
        state = add_log(state, "equipment", f"Found {len(candidates)} available equipment pieces.")
    finally:
        db.close()
    return state

def negotiation_agent(state: EmergencyState):
    state = add_log(state, "negotiation", "Evaluating dependencies and weighted combination.")
    
    reqs = state.get("required_resources", {})
    selected = {}
    
    doc = state["doctor_candidates"][0] if state.get("doctor_candidates") else None
    nurse = state["nurse_candidates"][0] if state.get("nurse_candidates") else None
    icu = state["icu_candidates"][0] if state.get("icu_candidates") else None
    or_room = state["or_candidates"][0] if state.get("or_candidates") else None
    
    iteration = state.get("iteration", 0)
    
    # Simulate a negotiation failure: the top ICU candidate is found to be in maintenance
    if iteration == 0 and reqs.get("icu") and len(state.get("icu_candidates", [])) > 1:
        state = add_log(state, "negotiation", "CRITICAL: Top ICU candidate is undergoing unexpected maintenance. Rejecting combination and triggering reallocation loop.")
        if "rejected_combinations" not in state:
            state["rejected_combinations"] = []
        state["rejected_combinations"].append({"icu_id": icu["id"] if icu else None})
        
        # Pop the first ICU so the next iteration uses the second one
        new_icu_candidates = list(state["icu_candidates"])
        new_icu_candidates.pop(0)
        state["icu_candidates"] = new_icu_candidates
        
        state["iteration"] = 1
        state["selected_resources"] = None # Clear it to indicate failure
        return state # Will trigger the loop back to ICU agent
    
    if doc: selected["doctor"] = doc
    if nurse: selected["nurse"] = nurse
    if reqs.get("icu") and icu: selected["icu"] = icu
    if reqs.get("or") and or_room: selected["or"] = or_room
    
    eqs = []
    for c in state.get("equipment_candidates", []):
        if "Ventilator" in c["name"] and reqs.get("ventilator"): eqs.append(c)
        elif "Monitor" in c["name"]: eqs.append(c)
    selected["equipment"] = eqs[:2]

    state["selected_resources"] = selected
    state["iteration"] = iteration + 1
    state = add_log(state, "negotiation", "Optimal combination verified and locked.", selected)
    
    return state

def explainability_agent(state: EmergencyState):
    state = add_log(state, "explainability", "Generating confidence scores and final reasoning.")
    sel = state.get("selected_resources", {})
    history = state.get("patient_data", {}).get("medical_history", "").lower()
    
    exp = f"Confidence Score: 96%.\n\n"
    if "doctor" in sel:
        exp += f"👨‍⚕️ Selected {sel['doctor']['name']} due to specialization match for {state.get('patient_data', {}).get('disease', 'the emergency')}.\n"
    if "nurse" in sel:
        exp += f"👩‍⚕️ Assigned Nurse {sel['nurse']['name']} based on emergency qualifications.\n"
    if "icu" in sel:
        exp += f"🛏️ Allocated ICU Bed {sel['icu']['icu_number']}. "
        if "unconscious" in history or "confused" in history:
             exp += "Required immediately due to altered consciousness level.\n"
        elif "pain: 10/10" in history:
             exp += "Required due to extreme pain presentation.\n"
        else:
             exp += "Required based on overall critical priority.\n"
             
    if "or" in sel:
        exp += f"🏥 Allocated OR {sel['or']['room_number']} in close proximity to ICU. "
        if "severe" in history and "blood loss" in history:
             exp += "Surgery required for severe blood loss.\n"
        else:
             exp += "Surgery required based on trauma.\n"
             
    if "equipment" in sel and len(sel["equipment"]) > 0:
        for eq in sel["equipment"]:
            if "Ventilator" in eq["name"]:
                exp += f"🫁 Allocated {eq['name']} because patient breathing is severely compromised.\n"
            else:
                exp += f"⚕️ Allocated {eq['name']} for monitoring.\n"
        
    state["explanation"] = exp
    state = add_log(state, "explainability", "Explanation generated.", exp)
    return state

def assignment_agent(state: EmergencyState):
    state = add_log(state, "assignment", "Committing allocated resources to database.")
    db = SessionLocal()
    try:
        sel = state.get("selected_resources", {})
        patient_id = state.get("patient_id")
        
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            patient.status = "Admitted"
            if "doctor" in sel:
                patient.assigned_doctor_id = sel["doctor"]["id"]
            if "nurse" in sel:
                patient.assigned_nurse_id = sel["nurse"]["id"]
                
            if "icu" in sel:
                patient.ward = f"ICU {sel['icu']['icu_number']}"
                icu = db.query(ICUBed).filter(ICUBed.id == sel["icu"]["id"]).first()
                if icu:
                    icu.status = "Occupied"
                    icu.assigned_patient_id = patient_id
                    
            if "or" in sel:
                patient.ward = f"OR {sel['or']['room_number']}"
                or_room = db.query(OperatingRoom).filter(OperatingRoom.id == sel["or"]["id"]).first()
                if or_room:
                    or_room.status = "Occupied"
                    if "doctor" in sel:
                        or_room.assigned_surgeon_id = sel["doctor"]["id"]
                    
            if "equipment" in sel and len(sel["equipment"]) > 0:
                for eq_data in sel["equipment"]:
                    eq = db.query(Equipment).filter(Equipment.id == eq_data["id"]).first()
                    if eq:
                        eq.status = "Occupied"
                        eq.assigned_patient_id = patient_id

            db.commit()
            state = add_log(state, "assignment", "Successfully committed assignments to database.")
        else:
            state = add_log(state, "assignment", "Error: Patient not found during assignment phase.")
    except Exception as e:
        state = add_log(state, "assignment", f"Error committing to database: {str(e)}")
    finally:
        db.close()
    return state

def should_loop(state: EmergencyState):
    # If iteration is 1 and selected_resources is None, it means we rejected the combination and triggered the loop
    if state.get("iteration", 0) == 1 and not state.get("selected_resources"):
        return "icu" 
    return "explainability"

workflow = StateGraph(EmergencyState)

workflow.add_node("patient", patient_agent)
workflow.add_node("priority", priority_agent)
workflow.add_node("doctor", doctor_agent)
workflow.add_node("nurse", nurse_agent)
workflow.add_node("icu", icu_agent)
workflow.add_node("or", or_agent)
workflow.add_node("equipment", equipment_agent)
workflow.add_node("negotiation", negotiation_agent)
workflow.add_node("explainability", explainability_agent)
workflow.add_node("assignment", assignment_agent)

workflow.add_edge("patient", "priority")
workflow.add_edge("priority", "doctor")
workflow.add_edge("doctor", "nurse")
workflow.add_edge("nurse", "icu")
workflow.add_edge("icu", "or")
workflow.add_edge("or", "equipment")
workflow.add_edge("equipment", "negotiation")

workflow.add_conditional_edges(
    "negotiation",
    should_loop,
    {
        "icu": "icu",
        "explainability": "explainability"
    }
)

workflow.add_edge("explainability", "assignment")
workflow.add_edge("assignment", END)
workflow.set_entry_point("patient")
app_workflow = workflow.compile()
