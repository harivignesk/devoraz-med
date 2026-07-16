from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.domain import Hospital, Doctor, Nurse, Patient, ICUBed, OperatingRoom, Ambulance, EmergencyQueue, User, RoleEnum
from app.schemas.domain import DashboardStats
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Filter base query based on role
    def apply_filter(query, model):
        if current_user.role == RoleEnum.hospital_admin and current_user.hospital_id:
            # Assuming models except Hospital have hospital_id
            if model == Hospital:
                return query.filter(Hospital.id == current_user.hospital_id)
            elif hasattr(model, 'hospital_id'):
                return query.filter(model.hospital_id == current_user.hospital_id)
        return query

    hospitals = apply_filter(db.query(Hospital), Hospital).count()
    doctors = apply_filter(db.query(Doctor), Doctor).count()
    nurses = apply_filter(db.query(Nurse), Nurse).count()
    patients = apply_filter(db.query(Patient), Patient).count()
    icu_beds = apply_filter(db.query(ICUBed), ICUBed).count()
    or_rooms = apply_filter(db.query(OperatingRoom), OperatingRoom).count()
    ambulances = apply_filter(db.query(Ambulance), Ambulance).count()
    emergencies = apply_filter(db.query(EmergencyQueue), EmergencyQueue).count()
    
    icu_avail = apply_filter(db.query(ICUBed).filter(ICUBed.status == "Available"), ICUBed).count()
    icu_occ = apply_filter(db.query(ICUBed).filter(ICUBed.status == "Occupied"), ICUBed).count()
    or_avail = apply_filter(db.query(OperatingRoom).filter(OperatingRoom.status == "Available"), OperatingRoom).count()
    or_occ = apply_filter(db.query(OperatingRoom).filter(OperatingRoom.status == "Occupied"), OperatingRoom).count()

    return DashboardStats(
        total_hospitals=hospitals,
        total_doctors=doctors,
        total_nurses=nurses,
        total_icu_beds=icu_beds,
        total_operating_rooms=or_rooms,
        total_ambulances=ambulances,
        total_patients=patients,
        emergency_cases=emergencies,
        icu_available=icu_avail,
        icu_occupied=icu_occ,
        or_available=or_avail,
        or_occupied=or_occ
    )
