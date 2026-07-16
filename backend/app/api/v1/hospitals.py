from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.models.domain import Hospital, User, RoleEnum
from app.schemas.domain import Hospital as HospitalSchema, HospitalCreate, HospitalUpdate
from app.api.deps import get_current_user, get_current_super_admin, get_current_staff

router = APIRouter()

class HospitalMapSchema(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float

@router.get("/map", response_model=List[HospitalMapSchema])
def get_hospitals_map(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.hospital_admin and current_user.hospital_id:
        hospitals = db.query(Hospital).filter(Hospital.id == current_user.hospital_id).all()
    else:
        hospitals = db.query(Hospital).all()
    
    return [
        HospitalMapSchema(
            id=h.id,
            name=h.name,
            latitude=h.latitude,
            longitude=h.longitude
        ) for h in hospitals
    ]

@router.post("/", response_model=HospitalSchema, status_code=status.HTTP_201_CREATED)
def create_hospital(
    hospital_in: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    hospital = Hospital(**hospital_in.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital

@router.get("/", response_model=List[HospitalSchema])
def read_hospitals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Hospital)
    
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(Hospital.id == current_user.hospital_id)
        
    if search:
        query = query.filter(Hospital.name.ilike(f"%{search}%"))
        
    hospitals = query.offset(skip).limit(limit).all()
    return hospitals

@router.get("/{hospital_id}", response_model=HospitalSchema)
def read_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.put("/{hospital_id}", response_model=HospitalSchema)
def update_hospital(
    hospital_id: int,
    hospital_in: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    update_data = hospital_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hospital, field, value)
        
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital

@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    db.delete(hospital)
    db.commit()
    return None
