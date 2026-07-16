import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    hospital_admin = "hospital_admin"
    doctor = "doctor"
    nurse = "nurse"
    ambulance_staff = "ambulance_staff"

class HospitalTypeEnum(str, enum.Enum):
    government = "Government"
    private = "Private"
    medical_college = "Medical College"

class ResourceStatusEnum(str, enum.Enum):
    available = "Available"
    occupied = "Occupied"
    reserved = "Reserved"
    cleaning = "Cleaning"
    maintenance = "Maintenance"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital = relationship("Hospital", back_populates="users")

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    contact_number = Column(String)
    emergency_contact = Column(String)
    type = Column(Enum(HospitalTypeEnum))
    status = Column(String, default="Active")

    users = relationship("User", back_populates="hospital")
    departments = relationship("Department", back_populates="hospital")
    doctors = relationship("Doctor", back_populates="hospital")
    nurses = relationship("Nurse", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")
    icu_beds = relationship("ICUBed", back_populates="hospital")
    operating_rooms = relationship("OperatingRoom", back_populates="hospital")
    ambulances = relationship("Ambulance", back_populates="hospital")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)
    description = Column(String)

    hospital = relationship("Hospital", back_populates="departments")
    doctors = relationship("Doctor", back_populates="department")
    nurses = relationship("Nurse", back_populates="department")

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    name = Column(String)
    gender = Column(String)
    age = Column(Integer)
    qualification = Column(String)
    specialization = Column(String)
    experience = Column(Integer)
    contact_number = Column(String)
    shift = Column(String)
    availability = Column(String)
    status = Column(String)
    medical_license_number = Column(String)

    user = relationship("User")
    hospital = relationship("Hospital", back_populates="doctors")
    department = relationship("Department", back_populates="doctors")
    assigned_patients = relationship("Patient", back_populates="assigned_doctor")

class Nurse(Base):
    __tablename__ = "nurses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    name = Column(String)
    qualification = Column(String)
    shift = Column(String)
    availability = Column(String)
    contact_number = Column(String)
    experience = Column(Integer)

    user = relationship("User")
    hospital = relationship("Hospital", back_populates="nurses")
    department = relationship("Department", back_populates="nurses")
    assigned_patients = relationship("Patient", back_populates="assigned_nurse")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    blood_group = Column(String)
    contact_number = Column(String)
    emergency_contact = Column(String)
    address = Column(String)
    medical_history = Column(Text)
    current_disease = Column(String)
    allergies = Column(String)
    insurance = Column(String)
    status = Column(String)
    admission_time = Column(DateTime, default=datetime.utcnow)
    ward = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"))
    assigned_nurse_id = Column(Integer, ForeignKey("nurses.id"))

    hospital = relationship("Hospital", back_populates="patients")
    assigned_doctor = relationship("Doctor", back_populates="assigned_patients")
    assigned_nurse = relationship("Nurse", back_populates="assigned_patients")

class EmergencyQueue(Base):
    __tablename__ = "emergency_queue"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    severity = Column(String)
    arrival_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String)
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"))
    assigned_ward = Column(String)
    emergency_notes = Column(Text)
    current_condition = Column(String)

class ICUBed(Base):
    __tablename__ = "icu_beds"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    icu_number = Column(String)
    status = Column(Enum(ResourceStatusEnum))
    equipment = Column(String)
    ventilator = Column(Boolean, default=False)
    cardiac_monitor = Column(Boolean, default=False)
    assigned_nurse_id = Column(Integer, ForeignKey("nurses.id"))
    assigned_patient_id = Column(Integer, ForeignKey("patients.id"))

    hospital = relationship("Hospital", back_populates="icu_beds")

class OperatingRoom(Base):
    __tablename__ = "operating_rooms"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    room_number = Column(String)
    status = Column(Enum(ResourceStatusEnum))
    current_surgery = Column(String)
    assigned_surgeon_id = Column(Integer, ForeignKey("doctors.id"))
    expected_completion_time = Column(DateTime)
    available_equipment = Column(String)

    hospital = relationship("Hospital", back_populates="operating_rooms")

class Ambulance(Base):
    __tablename__ = "ambulances"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    ambulance_number = Column(String)
    vehicle_type = Column(String)
    driver = Column(String)
    status = Column(Enum(ResourceStatusEnum))
    latitude = Column(Float)
    longitude = Column(Float)
    assigned_case_id = Column(Integer, ForeignKey("emergency_queue.id"))

    hospital = relationship("Hospital", back_populates="ambulances")

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    name = Column(String) # Ventilators, ECG Machines, MRI, CT Scan, Ultrasound, Defibrillators
    status = Column(Enum(ResourceStatusEnum))
    maintenance_date = Column(DateTime)
    assigned_patient_id = Column(Integer, ForeignKey("patients.id"))
    current_location = Column(String)

class BloodBank(Base):
    __tablename__ = "blood_bank"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    blood_group = Column(String)
    available_units = Column(Integer)
    reserved_units = Column(Integer)
    expiry_date = Column(DateTime)
    donor_details = Column(String)
