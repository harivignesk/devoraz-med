from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.domain import Patient, User, RoleEnum
from app.schemas.domain import Patient as PatientSchema, PatientCreate, PatientUpdate
from app.api.deps import get_current_user, get_current_staff

router = APIRouter()

@router.post("/", response_model=PatientSchema, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != patient_in.hospital_id:
        raise HTTPException(status_code=403, detail="Cannot register patient for another hospital")

    patient = Patient(**patient_in.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/", response_model=List[PatientSchema])
def read_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    hospital_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient)
    
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
    elif hospital_id:
        query = query.filter(Patient.hospital_id == hospital_id)
        
    if department_id:
        query = query.filter(Patient.department_id == department_id)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{patient_id}", response_model=PatientSchema)
def read_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != patient.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    return patient

@router.put("/{patient_id}", response_model=PatientSchema)
def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != patient.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
        
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != patient.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    db.delete(patient)
    db.commit()
    return None
