"""
test_api.py
Integration tests for FastAPI REST API endpoints.
Tests health check, plan generation, scenario comparison, dashboard statistics,
and CSV report download using TestClient.
"""

import sys
import os
from datetime import datetime
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database import Base, engine


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup if needed


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data


def test_create_and_get_plan(client):
    payload = {
        "previous_surgery_end": "2026-11-09T10:30:00",
        "next_scheduled_time": "2026-11-09T11:45:00",
        "patient_ready_time": "2026-11-09T11:15:00",
        "cleaning_protocol": "Normal cleaning",
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

    create_resp = client.post("/api/plans", json=payload)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert "id" in created_data
    plan_id = created_data["id"]
    assert created_data["status"] == "ON TIME"  # Calculated 11:35 <= Scheduled 11:45
    assert len(created_data["task_schedules"]) == 9

    # Get by ID
    get_resp = client.get(f"/api/plans/{plan_id}")
    assert get_resp.status_code == 200
    plan_data = get_resp.json()
    assert plan_data["id"] == plan_id

    # List plans
    list_resp = client.get("/api/plans")
    assert list_resp.status_code == 200
    plans = list_resp.json()
    assert len(plans) >= 1


def test_compare_scenarios(client):
    payload = {
        "previous_surgery_end": "2026-11-09T10:30:00",
        "next_scheduled_time": "2026-11-09T11:30:00",
        "patient_ready_time": "2026-11-09T11:15:00",
        "sterilisation_duration": 30,
        "waiting_duration": 10,
        "restocking_duration": 15,
        "setup_duration": 15,
        "transfer_duration": 10
    }
    resp = client.post("/api/scenarios/compare", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["scenarios"]) == 4
    scenario_names = [s["scenario_name"] for s in data["scenarios"]]
    assert any("Normal Cleaning + All Staff" in s for s in scenario_names)
    assert any("Deep Cleaning + All Staff" in s for s in scenario_names)


def test_dashboard_stats(client):
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert "total_plans" in stats
    assert "on_time_count" in stats
    assert "delayed_count" in stats
    assert "infeasible_count" in stats
    assert "avg_turnaround_duration" in stats
    assert stats["total_plans"] >= 1


def test_report_and_csv_download(client):
    # Retrieve a plan id
    list_resp = client.get("/api/plans")
    plans = list_resp.json()
    assert len(plans) > 0
    plan_id = plans[0]["id"]

    # Final report JSON
    rep_resp = client.get(f"/api/reports/{plan_id}")
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert rep_data["plan_id"] == plan_id

    # CSV Download
    csv_resp = client.get(f"/api/reports/{plan_id}/csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "OPERATION THEATRE TURNAROUND PLANNER" in csv_resp.text

