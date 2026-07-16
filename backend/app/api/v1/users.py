from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.db.database import get_db
from app.models.domain import User
from app.schemas.domain import User as UserSchema, UserUpdate
from app.api.deps import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    return current_user

@router.put("/me", response_model=UserSchema)
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if user_in.email is not None:
        # Check if email is already taken
        user_with_email = db.query(User).filter(User.email == user_in.email).first()
        if user_with_email and user_with_email.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_in.email
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user
