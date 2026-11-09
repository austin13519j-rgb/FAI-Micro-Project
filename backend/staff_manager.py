"""
staff_manager.py
Operation Theatre Turnaround Planner - Staff Availability & Assignment Manager.
Enforces qualification rules, prevents double-booking across simultaneous tasks,
tracks busy time intervals, and detects resource infeasibilities.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional


class StaffManager:
    """
    Manages hospital staff scheduling, qualification constraints,
    busy intervals (to prevent double-booking), and conflict auditing.
    """

    DEFAULT_ROLES = [
        "Cleaning Staff",
        "Sterilisation Staff",
        "OT Nurse",
        "Support Staff"
    ]

    def __init__(self, availability: Optional[Dict[str, bool]] = None):
        # Default all staff available
        self.availability: Dict[str, bool] = {role: True for role in self.DEFAULT_ROLES}
        if availability:
            self.set_availability(availability)

        # Qualification matrix:
        # A primary role can be substituted by a secondary qualified role if available.
        # Clinical roles (like OT Nurse) cannot be substituted by non-clinical staff.
        self.qualifications: Dict[str, List[str]] = {
            "Cleaning Staff": ["Cleaning Staff", "Support Staff"],
            "Sterilisation Staff": ["Sterilisation Staff", "OT Nurse"],
            "OT Nurse": ["OT Nurse"],
            "Support Staff": ["Support Staff", "Cleaning Staff"],
        }

        # Track busy time intervals per role: role -> list of (start_datetime, end_datetime)
        self.busy_intervals: Dict[str, List[Tuple[datetime, datetime]]] = {
            role: [] for role in self.DEFAULT_ROLES
        }

        # Recorded conflicts
        self.conflicts: List[Dict[str, Any]] = []
        self.has_unresolvable_conflict: bool = False

    def set_availability(self, available: Dict[str, bool]) -> None:
        """Update staff availability flags from user input."""
        for role, is_avail in available.items():
            if role in self.availability:
                self.availability[role] = bool(is_avail)

    def is_role_free_during(self, role: str, start: datetime, end: datetime) -> bool:
        """Check if a staff member has any conflicting overlapping commitment."""
        for (busy_start, busy_end) in self.busy_intervals.get(role, []):
            # Overlap check: start < busy_end and busy_start < end
            if start < busy_end and busy_start < end:
                return False
        return True

    def find_earliest_slot_for_roles(
        self,
        required_roles: List[str],
        earliest_start: datetime,
        duration_minutes: int,
        task_id: str = "",
        task_name: str = ""
    ) -> Tuple[List[str], datetime, bool]:
        """
        Assigns qualified available staff for the required roles.
        Finds the earliest start time >= earliest_start where all assigned
        staff are simultaneously free and prevents double-booking.

        Returns:
            (assigned_staff_roles, feasible_start_time, is_conflict)
        """
        if not required_roles:
            return [], earliest_start, False

        # Step 1: Check if each required role has at least one available candidate
        candidate_options: List[List[str]] = []
        for role in required_roles:
            candidates = [
                cand for cand in self.qualifications.get(role, [role])
                if self.availability.get(cand, False)
            ]
            if not candidates:
                # Unresolvable missing staff!
                self.has_unresolvable_conflict = True
                self.conflicts.append({
                    "task_id": task_id,
                    "task_name": task_name,
                    "missing_role": role,
                    "conflict_description": (
                        f"Staff role '{role}' required for '{task_name}' is unavailable "
                        f"and has no qualified substitute on duty."
                    )
                })
                # Infeasible: return empty assignment and flag conflict
                return [], earliest_start, True

            candidate_options.append(candidates)

        # Step 2: Search forward in 1-minute steps for the earliest feasible time
        # where distinct staff can be assigned without double-booking
        duration_delta = timedelta(minutes=duration_minutes)
        search_time = earliest_start

        # Practical upper bound: search up to 24 hours
        max_search = earliest_start + timedelta(hours=24)

        while search_time <= max_search:
            tentative_end = search_time + duration_delta

            # Try to find a valid assignment of distinct candidates for all required roles
            assigned = self._backtrack_assign(candidate_options, 0, set(), search_time, tentative_end)
            if assigned is not None:
                return assigned, search_time, False

            # Advance by 1 minute
            search_time += timedelta(minutes=1)

        # Fallback if beyond search bound
        self.has_unresolvable_conflict = True
        return [], earliest_start, True

    def _backtrack_assign(
        self,
        candidate_options: List[List[str]],
        role_index: int,
        already_used: set,
        start_time: datetime,
        end_time: datetime
    ) -> Optional[List[str]]:
        """
        Backtracking helper to match distinct staff members to required roles
        without collision within the same task or other ongoing tasks.
        """
        if role_index >= len(candidate_options):
            return []

        candidates = candidate_options[role_index]
        for cand in candidates:
            if cand not in already_used and self.is_role_free_during(cand, start_time, end_time):
                sub_res = self._backtrack_assign(
                    candidate_options,
                    role_index + 1,
                    already_used | {cand},
                    start_time,
                    end_time
                )
                if sub_res is not None:
                    return [cand] + sub_res

        return None

    def commit_assignment(self, assigned_roles: List[str], start_time: datetime, end_time: datetime) -> None:
        """Record busy intervals for assigned staff members to prevent future double-booking."""
        if start_time >= end_time:
            return
        for role in assigned_roles:
            self.busy_intervals[role].append((start_time, end_time))

    def get_conflicts(self) -> List[Dict[str, Any]]:
        """Returns the list of detected staff conflicts."""
        return self.conflicts

