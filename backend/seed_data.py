"""
seed_data.py
Operation Theatre Turnaround Planner - Demo Seed Data Generator.
Populates realistic hospital surgical turnaround scenarios into the database
so the dashboard and history are immediately rich with data for academic demonstrations.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal, init_db
from models import SurgeryPlan
from schemas import PlanCreateRequest
from planner import ForwardPlanner
import crud

def seed_database():
    """Seeds the database with representative clinical test cases."""
    init_db()
    db = SessionLocal()

    # Check if data already exists
    existing_count = db.query(SurgeryPlan).count()
    if existing_count > 0:
        print(f"[Seed] Database already contains {existing_count} plans. Skipping seed.")
        db.close()
        return

    print("[Seed] Populating initial demonstration surgery turnaround plans...")
    planner = ForwardPlanner()

    # Base reference date: today
    now = datetime.now(timezone.utc)
    base_date = now.replace(minute=0, second=0, microsecond=0)

    demo_cases = [
        # Case 1: Standard Laparoscopic Cholecystectomy (Normal cleaning, on-time turnaround)
        {
            "cleaning_protocol": "Normal cleaning",
            "previous_surgery_end": base_date.replace(hour=8, minute=30),
            "next_scheduled_time": base_date.replace(hour=9, minute=45),
            "patient_ready_time": base_date.replace(hour=9, minute=15),
            "cleaning_duration": 20,
            "sterilisation_duration": 30,
            "waiting_duration": 10,
            "restocking_duration": 15,
            "setup_duration": 15,
            "transfer_duration": 10,
            "staff_availability": {
                "Cleaning Staff": True,
                "Sterilisation Staff": True,
                "OT Nurse": True,
                "Support Staff": True
            }
        },
        # Case 2: Orthopaedic Joint Replacement (Deep cleaning required, slight delay)
        {
            "cleaning_protocol": "Deep cleaning",
            "previous_surgery_end": base_date.replace(hour=10, minute=0),
            "next_scheduled_time": base_date.replace(hour=11, minute=15),
            "patient_ready_time": base_date.replace(hour=10, minute=50),
            "cleaning_duration": 50,
            "sterilisation_duration": 30,
            "waiting_duration": 10,
            "restocking_duration": 15,
            "setup_duration": 15,
            "transfer_duration": 10,
            "staff_availability": {
                "Cleaning Staff": True,
                "Sterilisation Staff": True,
                "OT Nurse": True,
                "Support Staff": True
            }
        },
        # Case 3: Emergency Hernioplasty (Cleaning staff absent, covered by Support Staff)
        {
            "cleaning_protocol": "Normal cleaning",
            "previous_surgery_end": base_date.replace(hour=12, minute=30),
            "next_scheduled_time": base_date.replace(hour=13, minute=45),
            "patient_ready_time": base_date.replace(hour=13, minute=10),
            "cleaning_duration": 20,
            "sterilisation_duration": 30,
            "waiting_duration": 10,
            "restocking_duration": 15,
            "setup_duration": 15,
            "transfer_duration": 10,
            "staff_availability": {
                "Cleaning Staff": False,
                "Sterilisation Staff": True,
                "OT Nurse": True,
                "Support Staff": True
            }
        },
        # Case 4: Septic Case with Absent Specialist (OT Nurse unavailable -> Infeasible)
        {
            "cleaning_protocol": "Deep cleaning",
            "previous_surgery_end": base_date.replace(hour=14, minute=15),
            "next_scheduled_time": base_date.replace(hour=15, minute=30),
            "patient_ready_time": base_date.replace(hour=15, minute=0),
            "cleaning_duration": 50,
            "sterilisation_duration": 30,
            "waiting_duration": 10,
            "restocking_duration": 15,
            "setup_duration": 15,
            "transfer_duration": 10,
            "staff_availability": {
                "Cleaning Staff": True,
                "Sterilisation Staff": True,
                "OT Nurse": False,
                "Support Staff": True
            }
        },
        # Case 5: Delayed Pre-op Patient (Pre-op delay pushes incision start)
        {
            "cleaning_protocol": "Normal cleaning",
            "previous_surgery_end": base_date.replace(hour=16, minute=0),
            "next_scheduled_time": base_date.replace(hour=17, minute=0),
            "patient_ready_time": base_date.replace(hour=17, minute=10), # Patient late in holding
            "cleaning_duration": 20,
            "sterilisation_duration": 30,
            "waiting_duration": 10,
            "restocking_duration": 15,
            "setup_duration": 15,
            "transfer_duration": 10,
            "staff_availability": {
                "Cleaning Staff": True,
                "Sterilisation Staff": True,
                "OT Nurse": True,
                "Support Staff": True
            }
        }
    ]

    for item in demo_cases:
        req = PlanCreateRequest(**item)
        plan_dict = planner.create_plan(
            previous_end=req.previous_surgery_end,
            next_scheduled=req.next_scheduled_time,
            patient_ready=req.patient_ready_time,
            cleaning_type=req.cleaning_protocol,
            cleaning_duration_min=req.cleaning_duration,
            sterilisation_duration_min=req.sterilisation_duration,
            waiting_time_min=req.waiting_duration,
            restock_duration_min=req.restocking_duration,
            setup_duration_min=req.setup_duration,
            transfer_duration_min=req.transfer_duration,
            available_staff=req.staff_availability
        )
        saved = crud.create_plan_record(db, plan_dict, req)
        print(f"  + Generated Demo Plan #{saved.id}: {saved.cleaning_protocol} -> Status: {saved.status}")

    db.close()
    print("[Seed] Successfully seeded 5 diverse operational demo cases.")

if __name__ == "__main__":
    seed_database()

