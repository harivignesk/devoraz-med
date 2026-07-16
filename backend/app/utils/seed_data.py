import random
import os
from faker import Faker
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.domain import Base, Hospital, HospitalTypeEnum, Department, User, RoleEnum, Doctor, Nurse, Patient, ICUBed, OperatingRoom, Ambulance, Equipment, BloodBank, ResourceStatusEnum
from app.core.security import get_password_hash

# Drop all tables and recreate them to ensure a fresh state
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

fake = Faker()

def seed_database():
    db = SessionLocal()
    
    print("Seeding database...")

    # Real hospital names in Chennai
    hospitals_data = [
        {"name": "Apollo Hospitals, Greams Road", "lat": 13.0617, "lon": 80.2483, "type": HospitalTypeEnum.private, "email": "admin@apollo.com"},
        {"name": "Fortis Malar Hospital, Adyar", "lat": 13.0118, "lon": 80.2573, "type": HospitalTypeEnum.private, "email": "admin@fortis.com"},
        {"name": "MIOT International", "lat": 13.0175, "lon": 80.1795, "type": HospitalTypeEnum.private, "email": "admin@miot.com"},
        {"name": "Kauvery Hospital, Alwarpet", "lat": 13.0337, "lon": 80.2562, "type": HospitalTypeEnum.private, "email": "admin@kauvery.com"},
        {"name": "SIMS Hospital, Vadapalani", "lat": 13.0504, "lon": 80.2120, "type": HospitalTypeEnum.private, "email": "admin@sims.com"},
        {"name": "Gleneagles Global Health City", "lat": 12.9098, "lon": 80.1983, "type": HospitalTypeEnum.private, "email": "admin@global.com"},
        {"name": "Madras Medical Mission", "lat": 13.0858, "lon": 80.1834, "type": HospitalTypeEnum.private, "email": "admin@mmm.com"},
        {"name": "Vijaya Hospital, Vadapalani", "lat": 13.0514, "lon": 80.2104, "type": HospitalTypeEnum.private, "email": "admin@vijaya.com"},
        {"name": "SRM Medical College Hospital", "lat": 12.8236, "lon": 80.0440, "type": HospitalTypeEnum.medical_college, "email": "admin@srm.com"},
        {"name": "Rajiv Gandhi Government General Hospital", "lat": 13.0818, "lon": 80.2764, "type": HospitalTypeEnum.government, "email": "admin@rggh.gov.in"}
    ]

    hospitals = []
    
    # Super Admin User
    super_admin_pass = "superpassword123"
    super_admin = User(
        email="superadmin@medsync.ai",
        hashed_password=get_password_hash(super_admin_pass),
        role=RoleEnum.super_admin
    )
    db.add(super_admin)
    db.commit()

    print(f"Created Super Admin: superadmin@medsync.ai / {super_admin_pass}")
    print("\n--- Hospital Admin Credentials ---")

    for h_data in hospitals_data:
        hospital = Hospital(
            name=h_data["name"],
            address=fake.address(),
            latitude=h_data["lat"],
            longitude=h_data["lon"],
            contact_number=fake.phone_number(),
            emergency_contact=fake.phone_number(),
            type=h_data["type"]
        )
        db.add(hospital)
        db.commit()
        db.refresh(hospital)
        hospitals.append(hospital)

        # Admin for this hospital
        admin_pass = "password123"
        admin = User(
            email=h_data["email"],
            hashed_password=get_password_hash(admin_pass),
            role=RoleEnum.hospital_admin,
            hospital_id=hospital.id
        )
        db.add(admin)
        print(f"Hospital: {h_data['name']}")
        print(f"Login: {h_data['email']} / {admin_pass}\n")

        # Departments
        dept_names = ["Emergency", "Cardiology", "Neurology", "Orthopedics", "General Surgery", "Radiology", "ICU", "Pediatrics"]
        departments = []
        for dname in dept_names:
            dept = Department(name=dname, hospital_id=hospital.id, description=f"{dname} Department")
            db.add(dept)
            db.commit()
            db.refresh(dept)
            departments.append(dept)

        # Doctors
        for _ in range(12): 
            dept = random.choice(departments)
            doc_user = User(
                email=fake.email(),
                hashed_password=get_password_hash("doctor123"),
                role=RoleEnum.doctor,
                hospital_id=hospital.id
            )
            db.add(doc_user)
            db.commit()

            doc = Doctor(
                user_id=doc_user.id,
                hospital_id=hospital.id,
                department_id=dept.id,
                name=f"Dr. {fake.name()}",
                gender=random.choice(["Male", "Female"]),
                age=random.randint(30, 65),
                qualification="MBBS, MD",
                specialization=dept.name,
                experience=random.randint(2, 30),
                contact_number=fake.phone_number(),
                shift=random.choice(["Morning", "Evening", "Night"]),
                availability="Available",
                status="Active",
                medical_license_number=fake.uuid4()[:8]
            )
            db.add(doc)
        
        # Nurses
        for _ in range(16):
            dept = random.choice(departments)
            nurse_user = User(
                email=fake.email(),
                hashed_password=get_password_hash("nurse123"),
                role=RoleEnum.nurse,
                hospital_id=hospital.id
            )
            db.add(nurse_user)
            db.commit()

            nurse = Nurse(
                user_id=nurse_user.id,
                hospital_id=hospital.id,
                department_id=dept.id,
                name=fake.name(),
                qualification="B.Sc Nursing",
                shift=random.choice(["Morning", "Evening", "Night"]),
                availability="Available",
                contact_number=fake.phone_number(),
                experience=random.randint(1, 20)
            )
            db.add(nurse)
            
        db.commit()

        # Resources: ICU Beds
        for i in range(10): 
            icu = ICUBed(
                hospital_id=hospital.id,
                icu_number=f"ICU-{i+1}",
                status=random.choice(list(ResourceStatusEnum)),
                ventilator=random.choice([True, False]),
                cardiac_monitor=True
            )
            db.add(icu)

        # Operating Rooms
        for i in range(3): 
            oroom = OperatingRoom(
                hospital_id=hospital.id,
                room_number=f"OR-{i+1}",
                status=random.choice(list(ResourceStatusEnum))
            )
            db.add(oroom)

        # Ambulances
        for i in range(4): 
            amb = Ambulance(
                hospital_id=hospital.id,
                ambulance_number=f"AMB-{fake.numerify('####')}",
                vehicle_type="ALS",
                driver=fake.name(),
                status=random.choice(list(ResourceStatusEnum)),
                latitude=h_data["lat"] + random.uniform(-0.01, 0.01),
                longitude=h_data["lon"] + random.uniform(-0.01, 0.01)
            )
            db.add(amb)
            
        # Patients
        for _ in range(40):
            pat = Patient(
                hospital_id=hospital.id,
                name=fake.name(),
                age=random.randint(5, 90),
                gender=random.choice(["Male", "Female"]),
                blood_group=random.choice(["A+", "B+", "O+", "AB+", "O-"]),
                contact_number=fake.phone_number(),
                address=fake.address(),
                status=random.choice(["Admitted", "Discharged", "Under Observation"])
            )
            db.add(pat)

    db.commit()
    print("Database seeded successfully with dummy data for Chennai Hospitals.")

if __name__ == "__main__":
    seed_database()
