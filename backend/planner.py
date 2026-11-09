"""
planner.py
Operation Theatre Turnaround Planner - Forward Planning Agent.
Orchestrates the forward planning pipeline from previous surgery completion
through cleaning, sterilisation, restocking, setup, patient readiness, and transfer.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from cleaning import get_cleaning_duration
from sterilisation import get_sterilisation_details
from staff_manager import StaffManager
from scheduler import TaskScheduler


class ForwardPlanner:
    """
    Deterministic forward-planning agent that progressively schedules
    all post-operative turnaround tasks and computes OT readiness and start times.
    """

    def __init__(self):
        self.scheduler = TaskScheduler()

    def create_plan(
        self,
        previous_end: datetime,
        next_scheduled: datetime,
        patient_ready: datetime,
        cleaning_type: str = "Normal cleaning",
        cleaning_duration_min: int = 20,
        sterilisation_duration_min: int = 30,
        waiting_time_min: int = 10,
        restock_duration_min: int = 15,
        setup_duration_min: int = 15,
        transfer_duration_min: int = 10,
        available_staff: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Executes forward planning under all temporal, precedence, and staff constraints.
        """
        # 1. Resolve cleaning duration
        clean_dur = get_cleaning_duration(cleaning_type, cleaning_duration_min)

        # 2. Resolve sterilisation & mandatory cooling duration
        steril_dur, wait_dur = get_sterilisation_details(
            sterilisation_duration_min, waiting_time_min
        )

        # 3. Initialize StaffManager with availability flags
        staff_manager = StaffManager(available_staff)

        # 4. Define all tasks with explicit dependencies and required staff roles
        # Format: (task_id, task_name, duration_min, dependencies, required_roles)
        tasks_def = [
            ("T1", "Complete Previous Surgery", 0, [], []),
            ("T2", "Clean Operation Theatre", clean_dur, ["T1"], ["Cleaning Staff"]),
            ("T3", "Sterilise Surgical Instruments", steril_dur, ["T1"], ["Sterilisation Staff"]),
            ("T4", "Mandatory Sterilisation Waiting", wait_dur, ["T3"], []),
            ("T5", "Restock Operation Theatre", restock_duration_min, ["T2"], ["Support Staff"]),
            ("T6", "Set Up Surgical Instruments", setup_duration_min, ["T4", "T5"], ["OT Nurse"]),
            ("T7", "Check Patient Readiness", 0, [], []),
            ("T8", "Transfer Patient to OT", transfer_duration_min, ["T6", "T7"], ["Support Staff", "OT Nurse"]),
            ("T9", "Confirm OT Readiness & Handover", 0, ["T8"], ["OT Nurse"]),
        ]

        # 5. Execute forward planning schedule
        schedule = self.scheduler.schedule_tasks(
            tasks_def=tasks_def,
            start_time=previous_end,
            patient_ready_time=patient_ready,
            staff_manager=staff_manager
        )

        # 6. Extract milestones and calculate final status
        conflicts = staff_manager.get_conflicts()
        has_infeasibility = staff_manager.has_unresolvable_conflict

        t6_end = self._get_task_end(schedule, "T6")  # OT room prepared
        t8_end = self._get_task_end(schedule, "T8")  # Patient transferred into OT

        ot_ready_time = t6_end
        calculated_start = t8_end

        if has_infeasibility or calculated_start is None:
            status = "INFEASIBLE - RESOURCE CONSTRAINT"
            delay_minutes = 0
            turnaround_duration = 0
        else:
            turnaround_duration = max(0, int((calculated_start - previous_end).total_seconds() / 60))
            if calculated_start > next_scheduled:
                delay_minutes = int((calculated_start - next_scheduled).total_seconds() / 60)
                status = "DELAYED"
            else:
                delay_minutes = 0
                status = "ON TIME"

        # 7. Identify parallel execution pairs
        parallel_info = self.scheduler.get_parallel_tasks(schedule)

        return {
            "schedule": schedule,
            "ot_ready_time": ot_ready_time,
            "calculated_start": calculated_start,
            "next_scheduled": next_scheduled,
            "previous_end": previous_end,
            "patient_ready": patient_ready,
            "delay_minutes": delay_minutes,
            "turnaround_duration": turnaround_duration,
            "status": status,
            "parallel_tasks": parallel_info,
            "staff_conflicts": conflicts,
            "inputs": {
                "cleaning_protocol": cleaning_type,
                "cleaning_duration": clean_dur,
                "sterilisation_duration": steril_dur,
                "waiting_duration": wait_dur,
                "restocking_duration": restock_duration_min,
                "setup_duration": setup_duration_min,
                "transfer_duration": transfer_duration_min,
                "available_staff": staff_manager.availability
            }
        }

    def run_scenarios(
        self,
        previous_end: datetime,
        next_scheduled: datetime,
        patient_ready: datetime,
        steril_dur: int = 30,
        wait_dur: int = 10,
        restock_dur: int = 15,
        setup_dur: int = 15,
        transfer_dur: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Runs all four core academic comparison scenarios deterministically:
        1. Normal cleaning + all staff available
        2. Deep cleaning + all staff available
        3. Normal cleaning + one staff member unavailable (Cleaning Staff)
        4. Deep cleaning + one staff member unavailable (Cleaning Staff)
        """
        all_staff = {
            "Cleaning Staff": True,
            "Sterilisation Staff": True,
            "OT Nurse": True,
            "Support Staff": True
        }
        one_staff_unavailable = {
            "Cleaning Staff": False,
            "Sterilisation Staff": True,
            "OT Nurse": True,
            "Support Staff": True
        }

        scenarios_config = [
            ("Scenario 1: Normal Cleaning + All Staff", "Normal cleaning", 20, all_staff),
            ("Scenario 2: Deep Cleaning + All Staff", "Deep cleaning", 50, all_staff),
            ("Scenario 3: Normal Cleaning + Staff Unavailable", "Normal cleaning", 20, one_staff_unavailable),
            ("Scenario 4: Deep Cleaning + Staff Unavailable", "Deep cleaning", 50, one_staff_unavailable),
        ]

        results = []
        for name, proto, c_dur, staff_flags in scenarios_config:
            plan = self.create_plan(
                previous_end=previous_end,
                next_scheduled=next_scheduled,
                patient_ready=patient_ready,
                cleaning_type=proto,
                cleaning_duration_min=c_dur,
                sterilisation_duration_min=steril_dur,
                waiting_time_min=wait_dur,
                restock_duration_min=restock_dur,
                setup_duration_min=setup_dur,
                transfer_duration_min=transfer_dur,
                available_staff=staff_flags
            )
            results.append({
                "scenario_name": name,
                "cleaning_protocol": proto,
                "ot_ready_time": plan["ot_ready_time"],
                "calculated_start": plan["calculated_start"],
                "delay_minutes": plan["delay_minutes"],
                "turnaround_duration": plan["turnaround_duration"],
                "status": plan["status"],
                "staff_conflicts_count": len(plan["staff_conflicts"]),
                "staff_conflicts": plan["staff_conflicts"],
                "plan_details": plan
            })

        return results

    def _get_task_end(self, schedule: List[Dict[str, Any]], task_id: str) -> Optional[datetime]:
        for task in schedule:
            if task["task_id"] == task_id:
                return task.get("end_time")
        return None

