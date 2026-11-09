export interface TaskSchedule {
  id?: number;
  plan_id?: number;
  task_id: string;
  task_name: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  assigned_staff: string;
  dependencies: string;
  task_status: string;
}

export interface StaffAvailability {
  id?: number;
  plan_id?: number;
  staff_role: string;
  is_available: boolean;
}

export interface StaffConflict {
  id?: number;
  plan_id?: number;
  task_name: string;
  missing_role: string;
  conflict_description: string;
}

export interface ParallelTask {
  task_1_id: string;
  task_1_name: string;
  task_2_id: string;
  task_2_name: string;
  overlap_minutes: number;
  description: string;
}

export interface SurgeryPlan {
  id: number;
  cleaning_protocol: string;
  previous_surgery_end: string;
  next_scheduled_time: string;
  patient_ready_time: string;
  cleaning_duration: number;
  sterilisation_duration: number;
  waiting_duration: number;
  restocking_duration: number;
  setup_duration: number;
  transfer_duration: number;
  ot_ready_time: string | null;
  calculated_start_time: string | null;
  delay_minutes: number;
  turnaround_duration: number;
  status: "ON TIME" | "DELAYED" | "INFEASIBLE - RESOURCE CONSTRAINT" | string;
  created_at: string;
  task_schedules: TaskSchedule[];
  staff_availabilities: StaffAvailability[];
  staff_conflicts: StaffConflict[];
  parallel_tasks: ParallelTask[];
}

export interface PlanCreatePayload {
  previous_surgery_end: string;
  next_scheduled_time: string;
  patient_ready_time: string;
  cleaning_protocol: string;
  cleaning_duration: number;
  sterilisation_duration: number;
  waiting_duration: number;
  restocking_duration: number;
  setup_duration: number;
  transfer_duration: number;
  staff_availability: Record<string, boolean>;
}

export interface ScenarioItem {
  scenario_name: string;
  cleaning_protocol: string;
  ot_ready_time: string | null;
  calculated_start: string | null;
  delay_minutes: number;
  turnaround_duration: number;
  status: string;
  staff_conflicts_count: number;
  staff_conflicts: StaffConflict[];
}

export interface ScenarioCompareResponse {
  scenarios: ScenarioItem[];
}

export interface DashboardStats {
  total_plans: number;
  on_time_count: number;
  delayed_count: number;
  infeasible_count: number;
  avg_turnaround_duration: number;
  current_ot_status: string;
  next_scheduled_surgery: string | null;
  estimated_ot_readiness: string | null;
  latest_plan: SurgeryPlan | null;
  recent_plans: SurgeryPlan[];
}

export interface FinalReportSummary {
  plan_id: number;
  created_at: string;
  cleaning_protocol: string;
  previous_surgery_end: string;
  next_scheduled_time: string;
  patient_ready_time: string;
  ot_ready_time: string;
  calculated_start_time: string;
  total_turnaround_duration: number;
  delay_minutes: number;
  status: string;
  staff_conflicts_count: number;
  staff_conflicts: Array<{
    task_name: string;
    missing_role: string;
    conflict_description: string;
  }>;
}

