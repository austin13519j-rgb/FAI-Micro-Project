"""
schemas.py
Operation Theatre Turnaround Planner - Pydantic Request & Response Schemas.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


# ============================================================================
# Task & Conflict Schemas
# ============================================================================

class TaskScheduleBase(BaseModel):
    task_id: str
    task_name: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: int
    assigned_staff: str
    dependencies: str
    task_status: str


class TaskScheduleResponse(TaskScheduleBase):
    id: Optional[int] = None
    plan_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class StaffAvailabilityResponse(BaseModel):
    id: Optional[int] = None
    plan_id: Optional[int] = None
    staff_role: str
    is_available: bool

    model_config = ConfigDict(from_attributes=True)


class StaffConflictResponse(BaseModel):
    id: Optional[int] = None
    plan_id: Optional[int] = None
    task_name: str
    missing_role: str
    conflict_description: str

    model_config = ConfigDict(from_attributes=True)


class ParallelTaskResponse(BaseModel):
    task_1_id: str
    task_1_name: str
    task_2_id: str
    task_2_name: str
    overlap_minutes: int
    description: str


# ============================================================================
# Plan Creation & Response
# ============================================================================

class PlanCreateRequest(BaseModel):
    previous_surgery_end: datetime = Field(..., description="Timestamp when prior surgery ended")
    next_scheduled_time: datetime = Field(..., description="Scheduled start timestamp for next surgery")
    patient_ready_time: datetime = Field(..., description="Timestamp when patient is ready in pre-op")

    cleaning_protocol: str = Field(default="Normal cleaning", description="'Normal cleaning' or 'Deep cleaning'")
    cleaning_duration: int = Field(default=20, ge=5, le=180)
    sterilisation_duration: int = Field(default=30, ge=5, le=180)
    waiting_duration: int = Field(default=10, ge=0, le=120)
    restocking_duration: int = Field(default=15, ge=5, le=120)
    setup_duration: int = Field(default=15, ge=5, le=120)
    transfer_duration: int = Field(default=10, ge=5, le=60)

    staff_availability: Dict[str, bool] = Field(
        default_factory=lambda: {
            "Cleaning Staff": True,
            "Sterilisation Staff": True,
            "OT Nurse": True,
            "Support Staff": True
        }
    )

    @field_validator("next_scheduled_time")
    @classmethod
    def validate_next_after_prev(cls, v: datetime, info) -> datetime:
        prev = info.data.get("previous_surgery_end")
        if prev and v <= prev:
            raise ValueError("Next surgery scheduled time must be strictly later than previous surgery completion time.")
        return v


class PlanResponse(BaseModel):
    id: int
    cleaning_protocol: str
    previous_surgery_end: datetime
    next_scheduled_time: datetime
    patient_ready_time: datetime

    cleaning_duration: int
    sterilisation_duration: int
    waiting_duration: int
    restocking_duration: int
    setup_duration: int
    transfer_duration: int

    ot_ready_time: Optional[datetime] = None
    calculated_start_time: Optional[datetime] = None
    delay_minutes: int
    turnaround_duration: int
    status: str
    created_at: datetime

    task_schedules: List[TaskScheduleResponse] = []
    staff_availabilities: List[StaffAvailabilityResponse] = []
    staff_conflicts: List[StaffConflictResponse] = []
    parallel_tasks: List[ParallelTaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Scenario Comparison
# ============================================================================

class ScenarioCompareRequest(BaseModel):
    previous_surgery_end: datetime
    next_scheduled_time: datetime
    patient_ready_time: datetime
    sterilisation_duration: int = 30
    waiting_duration: int = 10
    restocking_duration: int = 15
    setup_duration: int = 15
    transfer_duration: int = 10


class ScenarioItemResponse(BaseModel):
    scenario_name: str
    cleaning_protocol: str
    ot_ready_time: Optional[datetime] = None
    calculated_start: Optional[datetime] = None
    delay_minutes: int
    turnaround_duration: int
    status: str
    staff_conflicts_count: int
    staff_conflicts: List[Dict[str, Any]] = []


class ScenarioCompareResponse(BaseModel):
    scenarios: List[ScenarioItemResponse]


# ============================================================================
# Dashboard Statistics
# ============================================================================

class DashboardStatsResponse(BaseModel):
    total_plans: int
    on_time_count: int
    delayed_count: int
    infeasible_count: int
    avg_turnaround_duration: float
    current_ot_status: str
    next_scheduled_surgery: Optional[datetime] = None
    estimated_ot_readiness: Optional[datetime] = None
    latest_plan: Optional[PlanResponse] = None
    recent_plans: List[PlanResponse] = []


# ============================================================================
# Health Check
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    database: str
    database_url_configured: bool
    version: str
