"""
scheduler.py
Operation Theatre Turnaround Planner - Forward Planning Task Scheduler.
Calculates the earliest feasible start time for every turnaround activity
respecting predecessor completions, staff qualifications, double-booking prevention,
and mandatory waiting constraints.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional


class TaskScheduler:
    """
    Core Forward Planning Scheduler.
    Computes deterministic earliest-start schedules under precedence,
    resource, and temporal constraints.
    """

    def __init__(self):
        self.schedule: List[Dict[str, Any]] = []

    def schedule_tasks(
        self,
        tasks_def: List[Tuple[str, str, int, List[str], List[str]]],
        start_time: datetime,
        patient_ready_time: datetime,
        staff_manager
    ) -> List[Dict[str, Any]]:
        """
        Executes forward planning loop across all tasks.

        Parameters:
            tasks_def: List of (task_id, task_name, duration_min, dependencies, required_roles)
            start_time: Previous surgery end datetime
            patient_ready_time: Patient readiness datetime
            staff_manager: StaffManager instance with availability and qualification rules

        Returns:
            List of scheduled task dictionary records
        """
        self.schedule = []
        completed_times: Dict[str, datetime] = {
            "T1": start_time,
            "T7": patient_ready_time,
        }

        # Topological processing order respecting turnaround workflow
        execution_order = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
        task_map = {t[0]: t for t in tasks_def}

        for tid in execution_order:
            if tid not in task_map:
                continue

            task_id, name, duration, deps, roles = task_map[tid]

            # Milestone / External event handling
            if task_id == "T1":
                self.schedule.append({
                    "task_id": "T1",
                    "task_name": name,
                    "start_time": start_time,
                    "end_time": start_time,
                    "duration_min": 0,
                    "assigned_staff": "N/A (Previous Surgery)",
                    "dependencies": [],
                    "task_status": "Completed"
                })
                completed_times["T1"] = start_time
                continue

            if task_id == "T7":
                self.schedule.append({
                    "task_id": "T7",
                    "task_name": name,
                    "start_time": patient_ready_time,
                    "end_time": patient_ready_time,
                    "duration_min": 0,
                    "assigned_staff": "N/A (Pre-op Holding)",
                    "dependencies": [],
                    "task_status": "Completed"
                })
                completed_times["T7"] = patient_ready_time
                continue

            # 1. Dependency completion: Earliest time all preceding tasks finish
            dep_end = start_time
            dep_infeasible = False
            for d in deps:
                if d in completed_times and completed_times[d] is not None:
                    dep_end = max(dep_end, completed_times[d])
                else:
                    dep_infeasible = True

            # If a predecessor could not be completed due to missing staff
            if dep_infeasible:
                self.schedule.append({
                    "task_id": task_id,
                    "task_name": name,
                    "start_time": None,
                    "end_time": None,
                    "duration_min": duration,
                    "assigned_staff": "Blocked by Predecessor",
                    "dependencies": deps,
                    "task_status": "Infeasible - Blocked Predecessor"
                })
                completed_times[task_id] = None
                continue

            # 2. Staff Assignment & Earliest Feasible Time
            if roles:
                assigned, feasible_start, has_conflict = staff_manager.find_earliest_slot_for_roles(
                    required_roles=roles,
                    earliest_start=dep_end,
                    duration_minutes=duration,
                    task_id=task_id,
                    task_name=name
                )

                if has_conflict:
                    self.schedule.append({
                        "task_id": task_id,
                        "task_name": name,
                        "start_time": None,
                        "end_time": None,
                        "duration_min": duration,
                        "assigned_staff": "UNASSIGNED (Missing Staff)",
                        "dependencies": deps,
                        "task_status": "Infeasible - Resource Constraint"
                    })
                    completed_times[task_id] = None
                    continue

                actual_start = feasible_start
                actual_end = actual_start + timedelta(minutes=duration)
                staff_manager.commit_assignment(assigned, actual_start, actual_end)
                assigned_str = ", ".join(assigned)
            else:
                # Passive task (e.g. T4 cooling wait)
                actual_start = dep_end
                actual_end = actual_start + timedelta(minutes=duration)
                assigned_str = "None (Passive / Waiting Process)"

            task_record = {
                "task_id": task_id,
                "task_name": name,
                "start_time": actual_start,
                "end_time": actual_end,
                "duration_min": duration,
                "assigned_staff": assigned_str,
                "dependencies": deps,
                "task_status": "Completed"
            }
            self.schedule.append(task_record)
            completed_times[task_id] = actual_end

        return self.schedule

    def get_parallel_tasks(self, schedule: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifies pairs and groups of tasks that execute concurrently in parallel.
        Returns a structured list with task details and time overlap.
        """
        parallel_pairs = []
        n = len(schedule)
        for i in range(n):
            t1 = schedule[i]
            if not t1.get("start_time") or not t1.get("end_time") or t1.get("duration_min", 0) <= 0:
                continue

            for j in range(i + 1, n):
                t2 = schedule[j]
                if not t2.get("start_time") or not t2.get("end_time") or t2.get("duration_min", 0) <= 0:
                    continue

                # Check time interval overlap: max(start1, start2) < min(end1, end2)
                overlap_start = max(t1["start_time"], t2["start_time"])
                overlap_end = min(t1["end_time"], t2["end_time"])

                if overlap_start < overlap_end:
                    overlap_minutes = int((overlap_end - overlap_start).total_seconds() / 60)
                    parallel_pairs.append({
                        "task_1_id": t1["task_id"],
                        "task_1_name": t1["task_name"],
                        "task_2_id": t2["task_id"],
                        "task_2_name": t2["task_name"],
                        "overlap_minutes": overlap_minutes,
                        "description": f"{t1['task_name']} || {t2['task_name']} ({overlap_minutes} min overlap)"
                    })

        return parallel_pairs

