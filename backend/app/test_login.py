import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.domain import User
from app.core.security import verify_password

def test_login():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@medsync.com").first()
    
    if not user:
        print("User not found!")
        return
        
    print(f"User found: {user.email}, Role: {user.role}")
    
    password_match = verify_password("admin123", user.hashed_password)
    print(f"Password match: {password_match}")
    
    db.close()

if __name__ == "__main__":
    test_login()
