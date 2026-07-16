from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.domain import Nurse, User, RoleEnum, Patient as PatientModel, ICUBed as ICUBedModel
from app.schemas.domain import Nurse as NurseSchema, NurseCreate, NurseUpdate
from app.api.deps import get_current_user, get_current_hospital_admin
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/", response_model=NurseSchema, status_code=status.HTTP_201_CREATED)
def create_nurse(
    nurse_in: NurseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hospital_admin)
):
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != nurse_in.hospital_id:
        raise HTTPException(status_code=403, detail="Cannot create nurse for another hospital")

    if db.query(User).filter(User.email == nurse_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=nurse_in.email,
        hashed_password=get_password_hash(nurse_in.password),
        role=RoleEnum.nurse,
        hospital_id=nurse_in.hospital_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    nurse_data = nurse_in.model_dump(exclude={"email", "password"})
    nurse = Nurse(**nurse_data, user_id=user.id)
    db.add(nurse)
    db.commit()
    db.refresh(nurse)
    return nurse

@router.get("/", response_model=List[NurseSchema])
def read_nurses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    hospital_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Nurse)
    
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(Nurse.hospital_id == current_user.hospital_id)
    elif hospital_id:
        query = query.filter(Nurse.hospital_id == hospital_id)
        
    if department_id:
        query = query.filter(Nurse.department_id == department_id)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{nurse_id}", response_model=NurseSchema)
def read_nurse(
    nurse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    nurse = db.query(Nurse).filter(Nurse.id == nurse_id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != nurse.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    return nurse

@router.put("/{nurse_id}", response_model=NurseSchema)
def update_nurse(
    nurse_id: int,
    nurse_in: NurseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hospital_admin)
):
    nurse = db.query(Nurse).filter(Nurse.id == nurse_id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != nurse.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    update_data = nurse_in.model_dump(exclude_unset=True)
    
    # Check if nurse is going Off Duty
    is_going_off_duty = update_data.get("status") == "Off Duty" or update_data.get("availability") == "Off Duty"
    
    for field, value in update_data.items():
        setattr(nurse, field, value)
        
    db.add(nurse)
    
    if is_going_off_duty:
        # 1. Unassign from patients
        patients = db.query(PatientModel).filter(PatientModel.assigned_nurse_id == nurse.id).all()
        for p in patients:
            p.assigned_nurse_id = None
            db.add(p)
            
        # 2. Unassign from ICU Beds
        icu_beds = db.query(ICUBedModel).filter(ICUBedModel.assigned_nurse_id == nurse.id).all()
        for bed in icu_beds:
            bed.assigned_nurse_id = None
            db.add(bed)
            
    db.commit()
    db.refresh(nurse)
    return nurse

@router.delete("/{nurse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nurse(
    nurse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_hospital_admin)
):
    nurse = db.query(Nurse).filter(Nurse.id == nurse_id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != nurse.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    user = db.query(User).filter(User.id == nurse.user_id).first()
    
    db.delete(nurse)
    if user:
        db.delete(user)
    db.commit()
    return None
