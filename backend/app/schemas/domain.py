from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# Using strings for Enum in schemas for simpler JSON serialization
class RoleEnum(str, Enum):
    super_admin = "super_admin"
    hospital_admin = "hospital_admin"
    doctor = "doctor"
    nurse = "nurse"
    ambulance_staff = "ambulance_staff"

class HospitalBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    contact_number: str
    emergency_contact: str
    type: str
    status: str = "Active"

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None

class Hospital(HospitalBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum
    hospital_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[RoleEnum] = None
    hospital_id: Optional[int] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    hospital_id: int

class Department(DepartmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DoctorBase(BaseModel):
    name: str
    gender: str
    age: int
    qualification: str
    specialization: str
    experience: int
    contact_number: str
    shift: str
    availability: str
    status: str
    medical_license_number: str
    hospital_id: int
    department_id: int

class DoctorCreate(DoctorBase):
    email: EmailStr
    password: str

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[int] = None
    contact_number: Optional[str] = None
    shift: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None
    medical_license_number: Optional[str] = None
    department_id: Optional[int] = None

class Doctor(DoctorBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class NurseBase(BaseModel):
    name: str
    qualification: str
    shift: str
    availability: str
    contact_number: str
    experience: int
    hospital_id: int
    department_id: int

class NurseCreate(NurseBase):
    email: EmailStr
    password: str

class NurseUpdate(BaseModel):
    name: Optional[str] = None
    qualification: Optional[str] = None
    shift: Optional[str] = None
    availability: Optional[str] = None
    contact_number: Optional[str] = None
    experience: Optional[int] = None
    department_id: Optional[int] = None

class Nurse(NurseBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: str
    contact_number: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    address: Optional[str] = ""
    medical_history: Optional[str] = ""
    current_disease: Optional[str] = ""
    allergies: Optional[str] = ""
    insurance: Optional[str] = ""
    status: str
    ward: Optional[str] = None
    department_id: Optional[int] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None

class PatientCreate(PatientBase):
    hospital_id: int

class PatientUpdate(BaseModel):
    status: Optional[str] = None
    ward: Optional[str] = None
    department_id: Optional[int] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    medical_history: Optional[str] = None
    current_disease: Optional[str] = None

class Patient(PatientBase):
    id: int
    hospital_id: int
    admission_time: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_hospitals: int
    total_doctors: int
    total_nurses: int
    total_icu_beds: int
    total_operating_rooms: int
    total_ambulances: int
    total_patients: int
    emergency_cases: int
    icu_available: int
    icu_occupied: int
    or_available: int
    or_occupied: int

class EquipmentBase(BaseModel):
    name: str
    status: str
    maintenance_date: Optional[datetime] = None
    current_location: Optional[str] = None
    assigned_patient_id: Optional[int] = None

class EquipmentCreate(EquipmentBase):
    hospital_id: int
    department_id: Optional[int] = None

class EquipmentUpdate(BaseModel):
    status: Optional[str] = None
    maintenance_date: Optional[datetime] = None
    current_location: Optional[str] = None
    assigned_patient_id: Optional[int] = None

class Equipment(EquipmentBase):
    id: int
    hospital_id: int
    department_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ICUBedBase(BaseModel):
    icu_number: str
    status: str
    ventilator: bool
    cardiac_monitor: bool
    equipment: Optional[str] = None
    assigned_nurse_id: Optional[int] = None
    assigned_patient_id: Optional[int] = None

class ICUBedUpdate(BaseModel):
    status: Optional[str] = None
    ventilator: Optional[bool] = None
    cardiac_monitor: Optional[bool] = None
    equipment: Optional[str] = None
    assigned_nurse_id: Optional[int] = None
    assigned_patient_id: Optional[int] = None

class ICUBed(ICUBedBase):
    id: int
    hospital_id: int
    model_config = ConfigDict(from_attributes=True)

class OperatingRoomBase(BaseModel):
    room_number: str
    status: str
    current_surgery: Optional[str] = None
    assigned_surgeon_id: Optional[int] = None
    expected_completion_time: Optional[datetime] = None
    available_equipment: Optional[str] = None

class OperatingRoomUpdate(BaseModel):
    status: Optional[str] = None
    current_surgery: Optional[str] = None
    assigned_surgeon_id: Optional[int] = None
    expected_completion_time: Optional[datetime] = None
    available_equipment: Optional[str] = None

class OperatingRoom(OperatingRoomBase):
    id: int
    hospital_id: int
    model_config = ConfigDict(from_attributes=True)

class AmbulanceBase(BaseModel):
    ambulance_number: str
    vehicle_type: str
    driver: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    assigned_case_id: Optional[int] = None

class Ambulance(AmbulanceBase):
    id: int
    hospital_id: int
    model_config = ConfigDict(from_attributes=True)

class EmergencyQueueBase(BaseModel):
    severity: str
    status: str
    assigned_doctor_id: Optional[int] = None
    assigned_ward: Optional[str] = None
    emergency_notes: Optional[str] = None
    current_condition: Optional[str] = None

class EmergencyQueueCreate(EmergencyQueueBase):
    patient_id: int
    hospital_id: int

class EmergencyQueueUpdate(BaseModel):
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_ward: Optional[str] = None
    emergency_notes: Optional[str] = None
    current_condition: Optional[str] = None

class EmergencyQueue(EmergencyQueueBase):
    id: int
    patient_id: int
    hospital_id: int
    arrival_time: datetime
    model_config = ConfigDict(from_attributes=True)
