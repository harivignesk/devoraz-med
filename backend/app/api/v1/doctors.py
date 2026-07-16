from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.domain import Doctor, User, RoleEnum, Patient as PatientModel, ICUBed as ICUBedModel, OperatingRoom as OperatingRoomModel
from app.schemas.domain import Doctor as DoctorSchema, DoctorCreate, DoctorUpdate
from app.api.deps import get_current_user, get_current_hospital_admin
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/", response_model=DoctorSchema, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hospital_admin)
):
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != doctor_in.hospital_id:
        raise HTTPException(status_code=403, detail="Cannot create doctor for another hospital")

    # Check if user email already exists
    if db.query(User).filter(User.email == doctor_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create User account for doctor
    user = User(
        email=doctor_in.email,
        hashed_password=get_password_hash(doctor_in.password),
        role=RoleEnum.doctor,
        hospital_id=doctor_in.hospital_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create Doctor profile
    doctor_data = doctor_in.model_dump(exclude={"email", "password"})
    doctor = Doctor(**doctor_data, user_id=user.id)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

@router.get("/", response_model=List[DoctorSchema])
def read_doctors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    hospital_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Doctor)
    
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(Doctor.hospital_id == current_user.hospital_id)
    elif hospital_id:
        query = query.filter(Doctor.hospital_id == hospital_id)
        
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{doctor_id}", response_model=DoctorSchema)
def read_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != doctor.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    return doctor

@router.put("/{doctor_id}", response_model=DoctorSchema)
def update_doctor(
    doctor_id: int,
    doctor_in: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hospital_admin)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != doctor.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    update_data = doctor_in.model_dump(exclude_unset=True)
    
    # Check if doctor is going Off Duty
    is_going_off_duty = update_data.get("status") == "Off Duty" or update_data.get("availability") == "Off Duty"
    
    for field, value in update_data.items():
        setattr(doctor, field, value)
        
    db.add(doctor)
    
    if is_going_off_duty:
        # 1. Unassign from patients
        patients = db.query(PatientModel).filter(PatientModel.assigned_doctor_id == doctor.id).all()
        for p in patients:
            p.assigned_doctor_id = None
            db.add(p)
            
        # 2. Unassign from ICU Beds
        icu_beds = db.query(ICUBedModel).filter(ICUBedModel.assigned_patient_id.in_([p.id for p in patients])).all()
        # Wait, the spec says "ICU assignments". We don't assign doctors to ICU beds directly, 
        # we assign them to patients. Or do we assign surgeons to ORs?
        # Let's check OperatingRoom model.
        ors = db.query(OperatingRoomModel).filter(OperatingRoomModel.assigned_surgeon_id == doctor.id).all()
        for room in ors:
            room.assigned_surgeon_id = None
            db.add(room)
            
    db.commit()
    db.refresh(doctor)
    return doctor

@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hospital_admin)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != doctor.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    # Also delete the associated user
    user = db.query(User).filter(User.id == doctor.user_id).first()
    
    db.delete(doctor)
    if user:
        db.delete(user)
    db.commit()
    return None
