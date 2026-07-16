from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.security import SECRET_KEY, ALGORITHM
from app.db.database import get_db
from app.models.domain import User, RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(db: Session = Depends(get_db)):
    # Hackathon Demo Mode: Bypass JWT Auth and return a dummy super admin
    dummy_user = User(
        id=1,
        email="demo@medsync.ai",
        role=RoleEnum.super_admin,
        hospital_id=1
    )
    return dummy_user

def get_current_super_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges"
        )
    return current_user

def get_current_hospital_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.hospital_admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges"
        )
    return current_user

def get_current_staff(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.hospital_admin, RoleEnum.doctor, RoleEnum.nurse, RoleEnum.ambulance_staff]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges"
        )
    return current_user
