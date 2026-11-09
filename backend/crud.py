"""
crud.py
Operation Theatre Turnaround Planner - Database CRUD Operations.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func

from models import SurgeryPlan, TaskSchedule, StaffAvailability, StaffConflict
from schemas import PlanCreateRequest


def create_plan_record(
    db: Session,
    plan_dict: Dict[str, Any],
    request: PlanCreateRequest
) -> SurgeryPlan:
    """
    Persists a generated surgery plan and its associated task schedule,
    staff availability settings, and detected resource conflicts.
    """
    plan = SurgeryPlan(
        cleaning_protocol=request.cleaning_protocol,
        previous_surgery_end=request.previous_surgery_end,
        next_scheduled_time=request.next_scheduled_time,
        patient_ready_time=request.patient_ready_time,
        cleaning_duration=request.cleaning_duration,
        sterilisation_duration=request.sterilisation_duration,
        waiting_duration=request.waiting_duration,
        restocking_duration=request.restocking_duration,
        setup_duration=request.setup_duration,
        transfer_duration=request.transfer_duration,
        ot_ready_time=plan_dict.get("ot_ready_time"),
        calculated_start_time=plan_dict.get("calculated_start"),
        delay_minutes=plan_dict.get("delay_minutes", 0),
        turnaround_duration=plan_dict.get("turnaround_duration", 0),
        status=plan_dict.get("status", "ON TIME"),
        created_at=datetime.now(timezone.utc)
    )
    db.add(plan)
    db.flush()  # Populates plan.id

    # Add task schedule rows
    for t in plan_dict.get("schedule", []):
        task_row = TaskSchedule(
            plan_id=plan.id,
            task_id=t.get("task_id", ""),
            task_name=t.get("task_name", ""),
            start_time=t.get("start_time"),
            end_time=t.get("end_time"),
            duration_minutes=t.get("duration_min", 0),
            assigned_staff=t.get("assigned_staff", "N/A"),
            dependencies=",".join(t.get("dependencies", [])),
            task_status=t.get("task_status", "Completed")
        )
        db.add(task_row)

    # Add staff availability snapshot
    for role, is_avail in request.staff_availability.items():
        avail_row = StaffAvailability(
            plan_id=plan.id,
            staff_role=role,
            is_available=bool(is_avail)
        )
        db.add(avail_row)

    # Add any detected staff conflicts
    for c in plan_dict.get("staff_conflicts", []):
        conflict_row = StaffConflict(
            plan_id=plan.id,
            task_name=c.get("task_name", ""),
            missing_role=c.get("missing_role", ""),
            conflict_description=c.get("conflict_description", "")
        )
        db.add(conflict_row)

    db.commit()
    db.refresh(plan)
    return plan


def get_plan_by_id(db: Session, plan_id: int) -> Optional[SurgeryPlan]:
    """Retrieves a single surgery plan by ID with all relationships eagerly loaded."""
    return (
        db.query(SurgeryPlan)
        .options(
            joinedload(SurgeryPlan.task_schedules),
            joinedload(SurgeryPlan.staff_availabilities),
            joinedload(SurgeryPlan.staff_conflicts)
        )
        .filter(SurgeryPlan.id == plan_id)
        .first()
    )


def get_all_plans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[str] = None
) -> List[SurgeryPlan]:
    """
    Retrieves all surgery plans with optional search and status filtering.
    """
    query = (
        db.query(SurgeryPlan)
        .options(
            joinedload(SurgeryPlan.task_schedules),
            joinedload(SurgeryPlan.staff_availabilities),
            joinedload(SurgeryPlan.staff_conflicts)
        )
    )

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(SurgeryPlan.status.ilike(f"%{status_filter}%"))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (SurgeryPlan.cleaning_protocol.ilike(search_term)) |
            (SurgeryPlan.status.ilike(search_term))
        )

    return query.order_by(desc(SurgeryPlan.created_at)).offset(skip).limit(limit).all()


def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
    """
    Computes live dashboard statistics directly from database records.
    Never returns hardcoded numbers.
    """
    total = db.query(SurgeryPlan).count()
    on_time = db.query(SurgeryPlan).filter(SurgeryPlan.status == "ON TIME").count()
    delayed = db.query(SurgeryPlan).filter(SurgeryPlan.status == "DELAYED").count()
    infeasible = db.query(SurgeryPlan).filter(SurgeryPlan.status.ilike("%INFEASIBLE%")).count()

    # Average turnaround duration for completed plans
    avg_turnaround = db.query(func.avg(SurgeryPlan.turnaround_duration)).filter(
        SurgeryPlan.status != "INFEASIBLE - RESOURCE CONSTRAINT"
    ).scalar() or 0.0

    latest_plan = (
        db.query(SurgeryPlan)
        .options(
            joinedload(SurgeryPlan.task_schedules),
            joinedload(SurgeryPlan.staff_availabilities),
            joinedload(SurgeryPlan.staff_conflicts)
        )
        .order_by(desc(SurgeryPlan.created_at))
        .first()
    )

    recent_plans = (
        db.query(SurgeryPlan)
        .options(
            joinedload(SurgeryPlan.task_schedules),
            joinedload(SurgeryPlan.staff_availabilities),
            joinedload(SurgeryPlan.staff_conflicts)
        )
        .order_by(desc(SurgeryPlan.created_at))
        .limit(10)
        .all()
    )

    current_status = latest_plan.status if latest_plan else "AWAITING INPUT"
    next_sched = latest_plan.next_scheduled_time if latest_plan else None
    estimated_ready = latest_plan.ot_ready_time if latest_plan else None

    return {
        "total_plans": total,
        "on_time_count": on_time,
        "delayed_count": delayed,
        "infeasible_count": infeasible,
        "avg_turnaround_duration": round(float(avg_turnaround), 1),
        "current_ot_status": current_status,
        "next_scheduled_surgery": next_sched,
        "estimated_ot_readiness": estimated_ready,
        "latest_plan": latest_plan,
        "recent_plans": recent_plans
    }


def delete_plan_by_id(db: Session, plan_id: int) -> bool:
    """Deletes a plan and cascades to tasks, availability, and conflicts."""
    plan = db.query(SurgeryPlan).filter(SurgeryPlan.id == plan_id).first()
    if not plan:
        return False
    db.delete(plan)
    db.commit()
    return True
