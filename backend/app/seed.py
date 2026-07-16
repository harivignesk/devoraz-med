import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.domain import User, RoleEnum, Hospital, HospitalTypeEnum
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    
    # Check if super admin exists
    admin = db.query(User).filter(User.role == RoleEnum.super_admin).first()
    if not admin:
        print("Creating default super admin...")
        admin = User(
            email="admin@medsync.com",
            hashed_password=get_password_hash("admin123"),
            role=RoleEnum.super_admin
        )
        db.add(admin)
        db.commit()
    
    # Create a default hospital if none exists
    hospital = db.query(Hospital).first()
    if not hospital:
        print("Creating default hospital...")
        hospital = Hospital(
            name="MedSync General Hospital",
            address="123 Health Ave, Medical District",
            latitude=13.04,
            longitude=80.22,
            contact_number="+1-555-0199",
            emergency_contact="+1-555-0911",
            type=HospitalTypeEnum.private,
            status="Active"
        )
        db.add(hospital)
        db.commit()
        db.refresh(hospital)
        
        print("Creating hospital admin...")
        h_admin = User(
            email="hadmin@medsync.com",
            hashed_password=get_password_hash("hadmin123"),
            role=RoleEnum.hospital_admin,
            hospital_id=hospital.id
        )
        db.add(h_admin)
        db.commit()
        
    print("Seeding complete.")
    db.close()

if __name__ == "__main__":
    seed_db()
