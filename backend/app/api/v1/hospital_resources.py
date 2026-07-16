from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.domain import User, RoleEnum, Doctor as DoctorModel, Patient as PatientModel, ICUBed as ICUBedModel, OperatingRoom as OperatingRoomModel, Ambulance as AmbulanceModel, Equipment as EquipmentModel, Department as DepartmentModel
from app.schemas.domain import Doctor, Patient, PatientUpdate, ICUBed, ICUBedUpdate, OperatingRoom, OperatingRoomUpdate, Ambulance, Equipment, EquipmentUpdate, Department

router = APIRouter()

def require_hospital_admin(current_user: User):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.hospital_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    if current_user.role == RoleEnum.hospital_admin and not current_user.hospital_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hospital Admin must be assigned to a hospital")
    return current_user

@router.get("/departments", response_model=List[Department])
def get_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(DepartmentModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(DepartmentModel.hospital_id == user.hospital_id)
    return query.all()

@router.get("/doctors", response_model=List[Doctor])
def get_doctors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(DoctorModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(DoctorModel.hospital_id == user.hospital_id)
    return query.all()

@router.get("/patients", response_model=List[Patient])
def get_patients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(PatientModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(PatientModel.hospital_id == user.hospital_id)
    return query.all()

@router.get("/icu-beds", response_model=List[ICUBed])
def get_icu_beds(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(ICUBedModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(ICUBedModel.hospital_id == user.hospital_id)
    return query.all()

@router.get("/operating-rooms", response_model=List[OperatingRoom])
def get_operating_rooms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(OperatingRoomModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(OperatingRoomModel.hospital_id == user.hospital_id)
    return query.all()

@router.get("/ambulances", response_model=List[Ambulance])
def get_ambulances(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(AmbulanceModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(AmbulanceModel.hospital_id == user.hospital_id)
    return query.all()

@router.get("/equipment", response_model=List[Equipment])
def get_equipment(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    query = db.query(EquipmentModel)
    if user.role == RoleEnum.hospital_admin:
        query = query.filter(EquipmentModel.hospital_id == user.hospital_id)
    return query.all()

@router.put("/patients/{patient_id}", response_model=Patient)
def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    db_patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.put("/icu-beds/{bed_id}", response_model=ICUBed)
def update_icu_bed(bed_id: int, bed_update: ICUBedUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    db_bed = db.query(ICUBedModel).filter(ICUBedModel.id == bed_id).first()
    if not db_bed:
        raise HTTPException(status_code=404, detail="ICU Bed not found")
    
    update_data = bed_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_bed, key, value)
    
    db.commit()
    db.refresh(db_bed)
    return db_bed

@router.put("/operating-rooms/{room_id}", response_model=OperatingRoom)
def update_operating_room(room_id: int, room_update: OperatingRoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    db_room = db.query(OperatingRoomModel).filter(OperatingRoomModel.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Operating Room not found")
    
    update_data = room_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_room, key, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room

@router.put("/equipment/{eq_id}", response_model=Equipment)
def update_equipment(eq_id: int, eq_update: EquipmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = require_hospital_admin(current_user)
    db_eq = db.query(EquipmentModel).filter(EquipmentModel.id == eq_id).first()
    if not db_eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = eq_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_eq, key, value)
    
    db.commit()
    db.refresh(db_eq)
    return db_eq
