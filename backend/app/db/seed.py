import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, engine
from app.models.domain import Base, Patient, Equipment, Doctor, Nurse, Department, Hospital, ICUBed, OperatingRoom

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if hospital exists
        hospital = db.query(Hospital).first()
        if not hospital:
            hospital = Hospital(name="MedSync General", address="123 Health Ave", type="Private", status="Active")
            db.add(hospital)
            db.commit()
            db.refresh(hospital)

        # Ensure departments exist
        if not db.query(Department).first():
            depts = [
                Department(name="Cardiology", hospital_id=hospital.id),
                Department(name="Neurology", hospital_id=hospital.id),
                Department(name="Emergency", hospital_id=hospital.id),
            ]
            db.add_all(depts)
            db.commit()

        # Generate Doctors if empty
        if not db.query(Doctor).first():
            print("Seeding Doctors...")
            dept_id = db.query(Department).first().id
            docs = [
                Doctor(name="Dr. Gregory House", specialization="Diagnostics", experience=20, status="Active", availability="Available", department_id=dept_id, hospital_id=hospital.id),
                Doctor(name="Dr. Lisa Cuddy", specialization="Endocrinology", experience=15, status="Active", availability="Busy", department_id=dept_id, hospital_id=hospital.id),
                Doctor(name="Dr. James Wilson", specialization="Oncology", experience=18, status="Active", availability="Off Duty", department_id=dept_id, hospital_id=hospital.id),
            ]
            db.add_all(docs)
            db.commit()

        # Generate Nurses if empty
        if not db.query(Nurse).first():
            print("Seeding Nurses...")
            dept_id = db.query(Department).first().id
            nurses = [
                Nurse(name="Nurse Jackie", qualification="ICU Nurse", experience=10, availability="Available", department_id=dept_id, hospital_id=hospital.id),
                Nurse(name="Nurse Ratched", qualification="Head Nurse", experience=25, availability="Busy", department_id=dept_id, hospital_id=hospital.id),
            ]
            db.add_all(nurses)
            db.commit()

        # Generate Patients
        print("Seeding Patients...")
        patient_count = db.query(Patient).count()
        if patient_count < 30: # Ensure we have plenty of patients
            doc_id = db.query(Doctor).first().id
            nurse_id = db.query(Nurse).first().id
            new_patients = [
                # Existing initial batch
                Patient(name="Alice Smith", age=45, gender="Female", blood_group="A+", current_disease="Fractured Arm", medical_history="None", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="General Ward"),
                Patient(name="Bob Jones", age=62, gender="Male", blood_group="O-", current_disease="Cardiac Arrest", medical_history="Hypertension", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="ICU Ward A"),
                Patient(name="Charlie Brown", age=22, gender="Male", blood_group="B+", current_disease="Mild Concussion", medical_history="None", status="Discharged", hospital_id=hospital.id),
                Patient(name="Diana Prince", age=30, gender="Female", blood_group="AB+", current_disease="Severe Bleeding", medical_history="Allergic to Penicillin", status="Emergency", hospital_id=hospital.id, ward="Emergency Room 1"),
                Patient(name="Evan Wright", age=55, gender="Male", blood_group="O+", current_disease="Stroke", medical_history="Diabetes", status="Admitted", hospital_id=hospital.id, ward="Neurology Ward"),
                # New Batch
                Patient(name="Fiona Gallagher", age=28, gender="Female", blood_group="A-", current_disease="Appendicitis", medical_history="None", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Surgery Ward"),
                Patient(name="George Miller", age=70, gender="Male", blood_group="O+", current_disease="Pneumonia", medical_history="Asthma", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="General Ward"),
                Patient(name="Hannah Abbott", age=19, gender="Female", blood_group="B-", current_disease="Food Poisoning", medical_history="None", status="Emergency", hospital_id=hospital.id, ward="Emergency Room 2"),
                Patient(name="Ian Somerhalder", age=42, gender="Male", blood_group="AB-", current_disease="Kidney Stones", medical_history="Family history of kidney stones", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Urology Ward"),
                Patient(name="Julia Roberts", age=53, gender="Female", blood_group="O+", current_disease="Migraine", medical_history="Chronic migraines", status="Discharged", hospital_id=hospital.id),
                Patient(name="Kevin Hart", age=35, gender="Male", blood_group="A+", current_disease="Torn ACL", medical_history="Sports injury", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Orthopedics Ward"),
                Patient(name="Laura Croft", age=29, gender="Female", blood_group="B+", current_disease="Malaria", medical_history="Recent travel to tropics", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Isolation Ward"),
                Patient(name="Michael Scott", age=48, gender="Male", blood_group="O-", current_disease="Burn Injury", medical_history="Accident at work", status="Emergency", hospital_id=hospital.id, ward="Emergency Room 3"),
                Patient(name="Nina Dobrev", age=31, gender="Female", blood_group="A-", current_disease="Asthma Attack", medical_history="Severe Asthma", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="ICU Ward B"),
                Patient(name="Oscar Isaac", age=41, gender="Male", blood_group="AB+", current_disease="COVID-19", medical_history="None", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Isolation Ward"),
                
                # 10 More Patients
                Patient(name="Paul Rudd", age=52, gender="Male", blood_group="A+", current_disease="Anemia", medical_history="Low Iron", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="General Ward"),
                Patient(name="Quinn Fabray", age=26, gender="Female", blood_group="O-", current_disease="Fractured Ribs", medical_history="None", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Orthopedics Ward"),
                Patient(name="Ryan Reynolds", age=44, gender="Male", blood_group="B+", current_disease="Concussion", medical_history="Head injury", status="Emergency", hospital_id=hospital.id, ward="Emergency Room 1"),
                Patient(name="Sarah Connor", age=56, gender="Female", blood_group="AB-", current_disease="Pneumothorax", medical_history="Smoker", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="ICU Ward A"),
                Patient(name="Tom Hanks", age=68, gender="Male", blood_group="A-", current_disease="Type 2 Diabetes", medical_history="Family history", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Endocrinology Ward"),
                Patient(name="Uma Thurman", age=51, gender="Female", blood_group="O+", current_disease="Gastroenteritis", medical_history="None", status="Discharged", hospital_id=hospital.id),
                Patient(name="Vin Diesel", age=54, gender="Male", blood_group="B-", current_disease="Hypertension", medical_history="High Blood Pressure", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Cardiology Ward"),
                Patient(name="Wanda Maximoff", age=33, gender="Female", blood_group="AB+", current_disease="Panic Attack", medical_history="Anxiety", status="Admitted", hospital_id=hospital.id, assigned_doctor_id=doc_id, assigned_nurse_id=nurse_id, ward="Psychiatry Ward"),
                Patient(name="Xavier Woods", age=37, gender="Male", blood_group="A+", current_disease="Muscle Strain", medical_history="Athlete", status="Discharged", hospital_id=hospital.id),
                Patient(name="Yvonne Strahovski", age=39, gender="Female", blood_group="O-", current_disease="Sepsis", medical_history="Recent surgery", status="Emergency", hospital_id=hospital.id, ward="ICU Ward B")
            ]
            db.add_all(new_patients)
            db.commit()

        # Generate Equipment
        print("Seeding Equipment...")
        eq_count = db.query(Equipment).count()
        if eq_count < 15:
            eqs = [
                Equipment(name="Ventilator V-Max Pro", status="Available", current_location="ICU Ward A", hospital_id=hospital.id),
                Equipment(name="Ventilator Respironics", status="Occupied", current_location="ICU Ward B", hospital_id=hospital.id),
                Equipment(name="Portable Ventilator", status="Maintenance", current_location="Storage", hospital_id=hospital.id),
                
                Equipment(name="Cardiac Monitor Philips", status="Available", current_location="Emergency Room 1", hospital_id=hospital.id),
                Equipment(name="ECG Machine GE", status="Available", current_location="Cardiology Dept", hospital_id=hospital.id),
                Equipment(name="Patient Vitals Monitor", status="Occupied", current_location="ICU Ward A", hospital_id=hospital.id),
                
                Equipment(name="Zoll Defibrillator", status="Available", current_location="Crash Cart 1", hospital_id=hospital.id),
                Equipment(name="AED Plus", status="Available", current_location="Hallway B", hospital_id=hospital.id),
                
                Equipment(name="Ultrasound Machine", status="Available", current_location="Radiology", hospital_id=hospital.id),
                Equipment(name="IV Infusion Pump", status="Occupied", current_location="General Ward", hospital_id=hospital.id),
            ]
            db.add_all(eqs)
            db.commit()
            
        print("Seeding Complete!")

    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
