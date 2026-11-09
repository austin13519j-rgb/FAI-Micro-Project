"""
report.py
Operation Theatre Turnaround Planner - Report & CSV Export Generator.
Formats plan summaries, task schedules, and generates compliant CSV reports.
Academic micro-project for B.Tech AI & Data Science (CO2, CO4, CO5).
"""

import io
import csv
from typing import Dict, Any


def generate_final_report_summary(plan) -> Dict[str, Any]:
    """
    Extracts high-level summary metrics from a SurgeryPlan model instance.
    """
    return {
        "plan_id": plan.id,
        "created_at": plan.created_at.strftime("%Y-%m-%d %H:%M:%S") if plan.created_at else "-",
        "cleaning_protocol": plan.cleaning_protocol,
        "previous_surgery_end": plan.previous_surgery_end.strftime("%H:%M") if plan.previous_surgery_end else "-",
        "next_scheduled_time": plan.next_scheduled_time.strftime("%H:%M") if plan.next_scheduled_time else "-",
        "patient_ready_time": plan.patient_ready_time.strftime("%H:%M") if plan.patient_ready_time else "-",
        "ot_ready_time": plan.ot_ready_time.strftime("%H:%M") if plan.ot_ready_time else "N/A (Infeasible)",
        "calculated_start_time": plan.calculated_start_time.strftime("%H:%M") if plan.calculated_start_time else "N/A (Infeasible)",
        "total_turnaround_duration": plan.turnaround_duration,
        "delay_minutes": plan.delay_minutes,
        "status": plan.status,
        "staff_conflicts_count": len(plan.staff_conflicts) if plan.staff_conflicts else 0,
        "staff_conflicts": [
            {
                "task_name": c.task_name,
                "missing_role": c.missing_role,
                "conflict_description": c.conflict_description
            }
            for c in (plan.staff_conflicts or [])
        ]
    }


def generate_csv_report(plan) -> str:
    """
    Generates a structured, production-grade CSV report for a given surgery plan.
    Includes summary metadata, complete task schedule breakdown, and staff conflict audit.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Title & Metadata Header
    writer.writerow(["OPERATION THEATRE TURNAROUND PLANNER - AUDIT REPORT"])
    writer.writerow(["Plan ID", plan.id])
    writer.writerow(["Generated Date", plan.created_at.strftime("%Y-%m-%d %H:%M:%S") if plan.created_at else "-"])
    writer.writerow(["Status", plan.status])
    writer.writerow([])

    # 2. Key Timing Metrics
    writer.writerow(["KEY TIMING & OPERATIONAL METRICS"])
    writer.writerow(["Previous Surgery Completion", plan.previous_surgery_end.strftime("%H:%M") if plan.previous_surgery_end else "-"])
    writer.writerow(["Next Surgery Scheduled", plan.next_scheduled_time.strftime("%H:%M") if plan.next_scheduled_time else "-"])
    writer.writerow(["Patient Pre-op Readiness", plan.patient_ready_time.strftime("%H:%M") if plan.patient_ready_time else "-"])
    writer.writerow(["OT Preparation Complete", plan.ot_ready_time.strftime("%H:%M") if plan.ot_ready_time else "Infeasible"])
    writer.writerow(["Calculated Surgery Start", plan.calculated_start_time.strftime("%H:%M") if plan.calculated_start_time else "Infeasible"])
    writer.writerow(["Total Turnaround Duration (min)", plan.turnaround_duration])
    writer.writerow(["Delay (minutes)", plan.delay_minutes])
    writer.writerow(["Cleaning Protocol", plan.cleaning_protocol])
    writer.writerow([])

    # 3. Task Schedule Breakdown
    writer.writerow(["FORWARD PLANNING TASK SCHEDULE"])
    writer.writerow([
        "Task ID",
        "Task Name",
        "Start Time",
        "End Time",
        "Duration (min)",
        "Assigned Staff",
        "Dependencies",
        "Task Status"
    ])

    for task in getattr(plan, "task_schedules", []):
        start_str = task.start_time.strftime("%H:%M") if task.start_time else "-"
        end_str = task.end_time.strftime("%H:%M") if task.end_time else "-"
        writer.writerow([
            task.task_id,
            task.task_name,
            start_str,
            end_str,
            task.duration_minutes,
            task.assigned_staff,
            task.dependencies or "None",
            task.task_status
        ])
    writer.writerow([])

    # 4. Staff Availability Flags
    writer.writerow(["STAFF AVAILABILITY CONFIGURATION"])
    writer.writerow(["Role", "Availability Status"])
    for sa in getattr(plan, "staff_availabilities", []):
        writer.writerow([sa.staff_role, "Available" if sa.is_available else "Unavailable"])
    writer.writerow([])

    # 5. Staff Conflicts Log
    writer.writerow(["RESOURCE CONFLICT AUDIT"])
    if getattr(plan, "staff_conflicts", []):
        writer.writerow(["Task Name", "Missing Role", "Conflict Description"])
        for sc in plan.staff_conflicts:
            writer.writerow([sc.task_name, sc.missing_role, sc.conflict_description])
    else:
        writer.writerow(["No staff conflicts detected. All required roles staffed."])

    return output.getvalue()

