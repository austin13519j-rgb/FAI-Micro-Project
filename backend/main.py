"""
main.py
Operation Theatre Turnaround Planner - FastAPI Application.
Exposes RESTful endpoints for forward planning, scenario comparison,
dashboard statistics, and CSV audit reports.
Deployable to Render with Neon PostgreSQL integration.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import engine, get_db, init_db
from models import SurgeryPlan
from schemas import (
    PlanCreateRequest,
    PlanResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    DashboardStatsResponse,
    HealthResponse,
    ParallelTaskResponse
)
from planner import ForwardPlanner
from scheduler import TaskScheduler
from seed_data import seed_database
import crud
import report


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created & seeded if empty
    try:
        init_db()
        seed_database()
    except Exception as e:
        print(f"[Startup Warning] Could not initialize or seed database: {e}")
    yield


app = FastAPI(
    title="Operation Theatre Turnaround Planner API",
    description="Forward Planning Agent Backend for OT Capacity & Turnaround Management.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
frontend_origin = os.getenv("FRONTEND_ORIGIN", "")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://*.vercel.app"
]
if frontend_origin:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

planner_engine = ForwardPlanner()
scheduler_engine = TaskScheduler()


# ============================================================================
# HEALTH ENDPOINT
# ============================================================================

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Checks backend service health and database connectivity.
    """
    db_status = "Disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "Connected"
    except Exception as e:
        db_status = f"Error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status,
        "database_url_configured": bool(os.getenv("DATABASE_URL")),
        "version": "1.0.0"
    }


# ============================================================================
# PLANS ENDPOINTS
# ============================================================================

def _build_plan_response(plan: SurgeryPlan) -> PlanResponse:
    """Helper to attach detected parallel tasks to plan response."""
    # Re-calculate parallel pairs for display in schedule
    task_dicts = [
        {
            "task_id": t.task_id,
            "task_name": t.task_name,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "duration_min": t.duration_minutes
        }
        for t in plan.task_schedules
    ]
    parallel_info = scheduler_engine.get_parallel_tasks(task_dicts)

    return PlanResponse(
        id=plan.id,
        cleaning_protocol=plan.cleaning_protocol,
        previous_surgery_end=plan.previous_surgery_end,
        next_scheduled_time=plan.next_scheduled_time,
        patient_ready_time=plan.patient_ready_time,
        cleaning_duration=plan.cleaning_duration,
        sterilisation_duration=plan.sterilisation_duration,
        waiting_duration=plan.waiting_duration,
        restocking_duration=plan.restocking_duration,
        setup_duration=plan.setup_duration,
        transfer_duration=plan.transfer_duration,
        ot_ready_time=plan.ot_ready_time,
        calculated_start_time=plan.calculated_start_time,
        delay_minutes=plan.delay_minutes,
        turnaround_duration=plan.turnaround_duration,
        status=plan.status,
        created_at=plan.created_at,
        task_schedules=plan.task_schedules,
        staff_availabilities=plan.staff_availabilities,
        staff_conflicts=plan.staff_conflicts,
        parallel_tasks=[ParallelTaskResponse(**p) for p in parallel_info]
    )


@app.post("/api/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED, tags=["Plans"])
def create_turnaround_plan(request: PlanCreateRequest, db: Session = Depends(get_db)):
    """
    Accepts timing, cleaning, sterilisation, setup parameters and staff availability.
    Runs the forward planning engine to calculate the earliest feasible schedule,
    persists the plan to Neon PostgreSQL, and returns the result.
    """
    # 1. Run forward planning
    plan_dict = planner_engine.create_plan(
        previous_end=request.previous_surgery_end,
        next_scheduled=request.next_scheduled_time,
        patient_ready=request.patient_ready_time,
        cleaning_type=request.cleaning_protocol,
        cleaning_duration_min=request.cleaning_duration,
        sterilisation_duration_min=request.sterilisation_duration,
        waiting_time_min=request.waiting_duration,
        restock_duration_min=request.restocking_duration,
        setup_duration_min=request.setup_duration,
        transfer_duration_min=request.transfer_duration,
        available_staff=request.staff_availability
    )

    # 2. Persist to database
    saved_plan = crud.create_plan_record(db, plan_dict, request)

    # 3. Format response
    return _build_plan_response(saved_plan)


@app.get("/api/plans", response_model=List[PlanResponse], tags=["Plans"])
def list_turnaround_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns all saved turnaround plans with search and status filtering.
    """
    plans = crud.get_all_plans(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status_filter=status_filter
    )
    return [_build_plan_response(p) for p in plans]


@app.get("/api/plans/{plan_id}", response_model=PlanResponse, tags=["Plans"])
def get_turnaround_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Returns full details, schedule breakdown, and conflict analysis for a specific plan.
    """
    plan = crud.get_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turnaround plan with ID {plan_id} was not found."
        )
    return _build_plan_response(plan)


@app.delete("/api/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Plans"])
def delete_turnaround_plan(plan_id: int, db: Session = Depends(get_db)):
    """Deletes a turnaround plan by ID."""
    success = crud.delete_plan_by_id(db, plan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turnaround plan with ID {plan_id} was not found."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================================================
# SCENARIO COMPARISON ENDPOINT
# ============================================================================

@app.post("/api/scenarios/compare", response_model=ScenarioCompareResponse, tags=["Scenarios"])
def compare_scenarios(request: ScenarioCompareRequest):
    """
    Executes four standardized operational scenarios using the forward planning engine:
    1. Normal cleaning + all staff available
    2. Deep cleaning + all staff available
    3. Normal cleaning + cleaning staff unavailable
    4. Deep cleaning + cleaning staff unavailable
    """
    scenarios = planner_engine.run_scenarios(
        previous_end=request.previous_surgery_end,
        next_scheduled=request.next_scheduled_time,
        patient_ready=request.patient_ready_time,
        steril_dur=request.sterilisation_duration,
        wait_dur=request.waiting_duration,
        restock_dur=request.restocking_duration,
        setup_dur=request.setup_duration,
        transfer_dur=request.transfer_duration
    )
    return {"scenarios": scenarios}


# ============================================================================
# DASHBOARD STATS ENDPOINT
# ============================================================================

@app.get("/api/dashboard/stats", response_model=DashboardStatsResponse, tags=["Dashboard"])
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """
    Retrieves live aggregate operational metrics calculated directly from database records.
    Never returns hardcoded statistics.
    """
    metrics = crud.get_dashboard_metrics(db)

    latest_resp = _build_plan_response(metrics["latest_plan"]) if metrics["latest_plan"] else None
    recent_resps = [_build_plan_response(p) for p in metrics["recent_plans"]]

    return DashboardStatsResponse(
        total_plans=metrics["total_plans"],
        on_time_count=metrics["on_time_count"],
        delayed_count=metrics["delayed_count"],
        infeasible_count=metrics["infeasible_count"],
        avg_turnaround_duration=metrics["avg_turnaround_duration"],
        current_ot_status=metrics["current_ot_status"],
        next_scheduled_surgery=metrics["next_scheduled_surgery"],
        estimated_ot_readiness=metrics["estimated_ot_readiness"],
        latest_plan=latest_resp,
        recent_plans=recent_resps
    )


# ============================================================================
# REPORTS & CSV ENDPOINTS
# ============================================================================

@app.get("/api/reports/{plan_id}", tags=["Reports"])
def get_final_report(plan_id: int, db: Session = Depends(get_db)):
    """
    Returns summary metrics, timing breakdown, and conflict audit for a plan.
    """
    plan = crud.get_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found."
        )
    return report.generate_final_report_summary(plan)


@app.get("/api/reports/{plan_id}/csv", tags=["Reports"])
def download_csv_report(plan_id: int, db: Session = Depends(get_db)):
    """
    Generates and downloads a structured CSV file for a given turnaround plan.
    """
    plan = crud.get_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} not found."
        )

    csv_data = report.generate_csv_report(plan)
    filename = f"OT_Turnaround_Plan_{plan_id}.csv"

    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

