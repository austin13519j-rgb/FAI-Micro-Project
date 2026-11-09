"""
test_planner.py
Comprehensive test suite for Operation Theatre Turnaround Forward Planning Engine.
Tests all 10 required academic scenarios:
1. Normal cleaning with all staff available.
2. Deep cleaning with all staff available.
3. Cleaning staff unavailable.
4. Sterilisation staff unavailable.
5. OT nurse unavailable.
6. Patient readiness delayed.
7. Sterilisation waiting time constraints.
8. Multiple simultaneous tasks (parallel opportunities).
9. Staff double-booking prevention.
10. Infeasible resource allocation.
"""

from datetime import datetime, timedelta
import pytest

from planner import ForwardPlanner
from staff_manager import StaffManager
from scheduler import TaskScheduler
from cleaning import get_cleaning_duration
from sterilisation import get_sterilisation_details


@pytest.fixture
def planner():
    return ForwardPlanner()


@pytest.fixture
def base_times():
    prev_end = datetime(2026, 11, 9, 10, 30)
    next_sched = datetime(2026, 11, 9, 11, 30)
    pat_ready = datetime(2026, 11, 9, 11, 15)
    return prev_end, next_sched, pat_ready


def test_1_normal_cleaning_all_staff(planner, base_times):
    """Test 1: Normal cleaning (20 min) with all staff available."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": True}
    )

    assert plan["status"] in ["ON TIME", "DELAYED"]
    assert plan["ot_ready_time"] is not None
    assert plan["calculated_start"] is not None
    # Cleaning finishes at 10:50; Restock 10:50->11:05
    # Sterilisation 10:30->11:00; Wait 11:00->11:10
    # Setup starts at max(11:05, 11:10) = 11:10, finishes 11:25
    # Patient ready at 11:15; max(11:25, 11:15) = 11:25
    # Transfer 11:25->11:35
    # Calculated start is 11:35; next scheduled is 11:30 -> Delay is 5 min
    assert plan["calculated_start"] == datetime(2026, 11, 9, 11, 35)
    assert plan["delay_minutes"] == 5
    assert plan["status"] == "DELAYED"
    assert len(plan["staff_conflicts"]) == 0


def test_2_deep_cleaning_all_staff(planner, base_times):
    """Test 2: Deep cleaning (50 min) with all staff available."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Deep cleaning",
        cleaning_duration_min=50,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": True}
    )

    # Deep clean finishes at 10:30 + 50m = 11:20
    # Restock finishes at 11:20 + 15m = 11:35
    # Setup can only start at max(11:10 [steril+wait], 11:35 [restock]) = 11:35
    # Setup finishes at 11:35 + 15m = 11:50
    # Transfer starts at max(11:50, 11:15) = 11:50, finishes at 12:00
    assert plan["calculated_start"] == datetime(2026, 11, 9, 12, 0)
    assert plan["delay_minutes"] == 30  # 12:00 - 11:30
    assert plan["status"] == "DELAYED"


def test_3_cleaning_staff_unavailable(planner, base_times):
    """Test 3: Cleaning Staff unavailable -> qualified Support Staff cross-covers."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": False, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": True}
    )

    # Support Staff is available and qualified to cover Cleaning Staff.
    # Therefore, no unresolvable conflict; cleaning succeeds with assigned Support Staff.
    t2 = next(t for t in plan["schedule"] if t["task_id"] == "T2")
    assert "Support Staff" in t2["assigned_staff"]
    assert plan["status"] in ["ON TIME", "DELAYED"]


def test_4_sterilisation_staff_unavailable(planner, base_times):
    """Test 4: Sterilisation Staff unavailable -> qualified OT Nurse cross-covers."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": False, "OT Nurse": True, "Support Staff": True}
    )

    # OT Nurse can cross-cover Sterilisation
    t3 = next(t for t in plan["schedule"] if t["task_id"] == "T3")
    assert "OT Nurse" in t3["assigned_staff"]


def test_5_ot_nurse_unavailable(planner, base_times):
    """Test 5: OT Nurse unavailable -> Specialist clinical role with no substitute => INFEASIBLE."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": True, "OT Nurse": False, "Support Staff": True}
    )

    assert plan["status"] == "INFEASIBLE - RESOURCE CONSTRAINT"
    assert len(plan["staff_conflicts"]) > 0
    missing_roles = [c["missing_role"] for c in plan["staff_conflicts"]]
    assert "OT Nurse" in missing_roles


def test_6_patient_readiness_delayed(planner):
    """Test 6: Patient readiness delayed beyond OT readiness."""
    prev_end = datetime(2026, 11, 9, 10, 30)
    next_sched = datetime(2026, 11, 9, 12, 15)
    # Patient ready very late at 12:00 (after OT is ready at 11:25)
    late_patient_ready = datetime(2026, 11, 9, 12, 0)

    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=late_patient_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": True}
    )

    # OT ready at 11:25, but Patient not ready until 12:00.
    # Patient transfer T8 must wait until 12:00!
    # Transfer finishes at 12:10.
    t8 = next(t for t in plan["schedule"] if t["task_id"] == "T8")
    assert t8["start_time"] == late_patient_ready
    assert t8["end_time"] == datetime(2026, 11, 9, 12, 10)
    assert plan["calculated_start"] == datetime(2026, 11, 9, 12, 10)
    assert plan["status"] == "ON TIME"


def test_7_sterilisation_waiting_time(planner, base_times):
    """Test 7: Mandatory sterilisation cooling time cannot be skipped."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=25,  # Extended cooling time
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": True}
    )

    t3 = next(t for t in plan["schedule"] if t["task_id"] == "T3")
    t4 = next(t for t in plan["schedule"] if t["task_id"] == "T4")
    t6 = next(t for t in plan["schedule"] if t["task_id"] == "T6")

    # T4 starts exactly when T3 ends
    assert t4["start_time"] == t3["end_time"]
    assert t4["duration_min"] == 25
    # T6 cannot start before T4 ends
    assert t6["start_time"] >= t4["end_time"]


def test_8_multiple_simultaneous_tasks(planner, base_times):
    """Test 8: Clean OT (T2) and Sterilise Instruments (T3) execute in parallel."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": True, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": True}
    )

    # Check parallel list
    parallel = plan["parallel_tasks"]
    assert len(parallel) > 0
    task_names = [p["description"] for p in parallel]
    assert any("Clean Operation Theatre" in desc and "Sterilise Surgical Instruments" in desc for desc in task_names)


def test_9_staff_double_booking_prevention(planner, base_times):
    """Test 9: Prevent double-booking a single staff member across simultaneous tasks."""
    prev_end, next_sched, pat_ready = base_times

    # If Cleaning Staff is unavailable, Support Staff must do Cleaning T2 (10:30-10:50).
    # Can Support Staff also do Restocking T5? Yes, but T5 depends on T2 so it's sequential.
    # What if a staff member is assigned to two tasks that would otherwise overlap?
    # Test interval scheduling directly:
    sm = StaffManager({"Support Staff": True, "Cleaning Staff": False})
    t1_start = datetime(2026, 11, 9, 10, 30)

    # Assign Support Staff from 10:30 to 11:00
    assigned, start, conflict = sm.find_earliest_slot_for_roles(
        ["Support Staff"], t1_start, 30, "TASK_A", "Task A"
    )
    assert not conflict
    assert start == t1_start
    sm.commit_assignment(assigned, start, start + timedelta(minutes=30))

    # Try assigning Support Staff to Task B which also wants to start at 10:30
    assigned_b, start_b, conflict_b = sm.find_earliest_slot_for_roles(
        ["Support Staff"], t1_start, 15, "TASK_B", "Task B"
    )
    assert not conflict_b
    # Must NOT start at 10:30; must wait until 11:00!
    assert start_b == datetime(2026, 11, 9, 11, 0)


def test_10_infeasible_resource_allocation(planner, base_times):
    """Test 10: Both Cleaning Staff and qualified substitute (Support Staff) unavailable => INFEASIBLE."""
    prev_end, next_sched, pat_ready = base_times
    plan = planner.create_plan(
        previous_end=prev_end,
        next_scheduled=next_sched,
        patient_ready=pat_ready,
        cleaning_type="Normal cleaning",
        cleaning_duration_min=20,
        sterilisation_duration_min=30,
        waiting_time_min=10,
        restock_duration_min=15,
        setup_duration_min=15,
        transfer_duration_min=10,
        available_staff={"Cleaning Staff": False, "Sterilisation Staff": True, "OT Nurse": True, "Support Staff": False}
    )

    assert plan["status"] == "INFEASIBLE - RESOURCE CONSTRAINT"
    assert len(plan["staff_conflicts"]) >= 1
    # Tasks dependent on cleaning cannot proceed
    t2 = next(t for t in plan["schedule"] if t["task_id"] == "T2")
    assert "Infeasible" in t2["task_status"]

