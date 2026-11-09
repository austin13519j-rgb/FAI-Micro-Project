"""
cleaning.py
Operation Theatre Turnaround Planner - Cleaning Protocol Module.
Defines cleaning protocols, duration logic, and validation.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

from typing import Tuple


def get_cleaning_duration(cleaning_type: str, user_duration: int) -> int:
    """
    Returns the cleaning duration in minutes.
    Prioritizes user-specified duration if positive; otherwise falls back to
    standard educational protocol defaults:
      - Normal cleaning: 20 minutes (standard surface disinfection & mopping)
      - Deep cleaning: 50 minutes (terminal disinfection, wall wash, HVAC filtration cycle)
    """
    if user_duration is not None and user_duration > 0:
        return int(user_duration)

    normalized_type = (cleaning_type or "").strip().lower()
    if "deep" in normalized_type:
        return 50
    return 20


def validate_cleaning_inputs(cleaning_type: str, duration: int) -> Tuple[bool, str]:
    """
    Validates cleaning type string and duration bounds.
    """
    if duration is not None and (duration < 5 or duration > 180):
        return False, "Cleaning duration must be between 5 and 180 minutes."
    return True, ""

