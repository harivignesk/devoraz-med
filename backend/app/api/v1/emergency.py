from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.domain import EmergencyQueue, User, RoleEnum
from app.schemas.domain import EmergencyQueue as EmergencyQueueSchema, EmergencyQueueCreate, EmergencyQueueUpdate
from app.api.deps import get_current_user, get_current_staff

router = APIRouter()

@router.post("/", response_model=EmergencyQueueSchema, status_code=status.HTTP_201_CREATED)
def create_emergency_case(
    case_in: EmergencyQueueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != case_in.hospital_id:
        raise HTTPException(status_code=403, detail="Cannot create emergency case for another hospital")

    case = EmergencyQueue(**case_in.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case

@router.get("/", response_model=List[EmergencyQueueSchema])
def read_emergency_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    hospital_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EmergencyQueue)
    
    if current_user.role != RoleEnum.super_admin:
        query = query.filter(EmergencyQueue.hospital_id == current_user.hospital_id)
    elif hospital_id:
        query = query.filter(EmergencyQueue.hospital_id == hospital_id)
        
    if status_filter:
        query = query.filter(EmergencyQueue.status == status_filter)
        
    # Sort by arrival time
    return query.order_by(EmergencyQueue.arrival_time.desc()).offset(skip).limit(limit).all()

@router.put("/{case_id}", response_model=EmergencyQueueSchema)
def update_emergency_case(
    case_id: int,
    case_in: EmergencyQueueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    case = db.query(EmergencyQueue).filter(EmergencyQueue.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Emergency case not found")
        
    if current_user.role != RoleEnum.super_admin and current_user.hospital_id != case.hospital_id:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    update_data = case_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
        
    db.add(case)
    db.commit()
    db.refresh(case)
    return case
