"""
models.py
Operation Theatre Turnaround Planner - SQLAlchemy ORM Models.
Defines database entities for surgery plans, task schedules, staff availability,
and staff conflict records matching Neon PostgreSQL requirements.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship

from database import Base


class SurgeryPlan(Base):
    """
    Main entity storing overall turnaround plan parameters, calculated milestones,
    and feasibility status.
    """
    __tablename__ = "surgery_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cleaning_protocol = Column(String(50), nullable=False, default="Normal cleaning")
    previous_surgery_end = Column(DateTime, nullable=False)
    next_scheduled_time = Column(DateTime, nullable=False)
    patient_ready_time = Column(DateTime, nullable=False)

    cleaning_duration = Column(Integer, nullable=False, default=20)
    sterilisation_duration = Column(Integer, nullable=False, default=30)
    waiting_duration = Column(Integer, nullable=False, default=10)
    restocking_duration = Column(Integer, nullable=False, default=15)
    setup_duration = Column(Integer, nullable=False, default=15)
    transfer_duration = Column(Integer, nullable=False, default=10)

    ot_ready_time = Column(DateTime, nullable=True)
    calculated_start_time = Column(DateTime, nullable=True)
    delay_minutes = Column(Integer, nullable=False, default=0)
    turnaround_duration = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="ON TIME")  # ON TIME, DELAYED, INFEASIBLE

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    task_schedules = relationship("TaskSchedule", back_populates="plan", cascade="all, delete-orphan", order_by="TaskSchedule.id")
    staff_availabilities = relationship("StaffAvailability", back_populates="plan", cascade="all, delete-orphan")
    staff_conflicts = relationship("StaffConflict", back_populates="plan", cascade="all, delete-orphan")


class TaskSchedule(Base):
    """
    Stores individual task scheduling details calculated by forward planning engine.
    """
    __tablename__ = "task_schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(Integer, ForeignKey("surgery_plans.id", ondelete="CASCADE"), nullable=False, index=True)

    task_id = Column(String(20), nullable=False)  # T1, T2, ...
    task_name = Column(String(100), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    assigned_staff = Column(String(200), nullable=False, default="N/A")
    dependencies = Column(String(100), nullable=False, default="")
    task_status = Column(String(50), nullable=False, default="Completed")

    plan = relationship("SurgeryPlan", back_populates="task_schedules")


class StaffAvailability(Base):
    """
    Stores the staff availability flags provided by the user for a given plan run.
    """
    __tablename__ = "staff_availability"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(Integer, ForeignKey("surgery_plans.id", ondelete="CASCADE"), nullable=False, index=True)

    staff_role = Column(String(100), nullable=False)
    is_available = Column(Boolean, nullable=False, default=True)

    plan = relationship("SurgeryPlan", back_populates="staff_availabilities")


class StaffConflict(Base):
    """
    Stores any resource conflicts or missing staffing issues flagged during forward planning.
    """
    __tablename__ = "staff_conflicts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(Integer, ForeignKey("surgery_plans.id", ondelete="CASCADE"), nullable=False, index=True)

    task_name = Column(String(100), nullable=False)
    missing_role = Column(String(100), nullable=False)
    conflict_description = Column(Text, nullable=False)

    plan = relationship("SurgeryPlan", back_populates="staff_conflicts")

