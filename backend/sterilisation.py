"""
sterilisation.py
Operation Theatre Turnaround Planner - Sterilisation Protocol Module.
Manages autoclave / sterilization durations and mandatory cooling / waiting constraints.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from typing import Tuple


def get_sterilisation_details(steril_duration: int, waiting_time: int) -> Tuple[int, int]:
    """
    Returns (sterilisation_duration_min, mandatory_waiting_min).
    Safety Rule: Mandatory cooling/aeration waiting time cannot be bypassed or skipped.
    """
    steril = max(5, int(steril_duration)) if steril_duration is not None else 30
    wait = max(0, int(waiting_time)) if waiting_time is not None else 10
    return steril, wait


def validate_sterilisation_inputs(steril_duration: int, waiting_time: int) -> Tuple[bool, str]:
    """
    Validates sterilization and cooling parameters.
    """
    if steril_duration is not None and (steril_duration < 5 or steril_duration > 180):
        return False, "Sterilisation duration must be between 5 and 180 minutes."
    if waiting_time is not None and (waiting_time < 0 or waiting_time > 120):
        return False, "Mandatory waiting/cooling time must be between 0 and 120 minutes."
    return True, ""

