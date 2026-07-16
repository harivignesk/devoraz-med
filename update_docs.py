import sys
import os

# Add the backend dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db.database import SessionLocal
from app.models.domain import Doctor

def update_doctors():
    db = SessionLocal()
    doctors = db.query(Doctor).all()
    if len(doctors) > 3:
        # Make the first 3 doctors inactive
        for i in range(3):
            doctors[i].status = "Inactive"
            doctors[i].availability = "On Leave"
        db.commit()
        print("Updated 3 doctors to Inactive.")
    else:
        print("Not enough doctors to update.")
    db.close()

if __name__ == "__main__":
    update_doctors()
