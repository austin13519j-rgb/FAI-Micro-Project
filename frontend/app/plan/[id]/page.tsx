"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  ArrowLeft,
  Users,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { SurgeryPlan } from "@/types/planner";
import { formatTimeOnly, formatDateTime, formatDuration } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import GanttChart from "@/components/GanttChart";

export default function GeneratedPlanPage() {
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<SurgeryPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;

    setIsLoading(true);
    setError(null);
    api
      .getPlanById(planId)
      .then((data) => setPlan(data))
      .catch((err) => setError(err.message || "Failed to load turnaround plan."))
      .finally(() => setIsLoading(false));
  }, [planId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Activity className="w-8 h-8 mx-auto animate-spin text-hospital-navy mb-3" />
        <h2 className="text-base font-semibold text-hospital-navy">
          Computing Forward Planning Schedule...
        </h2>
        <p className="text-xs text-hospital-greyText mt-1">
          Evaluating dependencies, staff intervals, and waiting constraints
        </p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-hospital-cardBg rounded-lg border border-hospital-subtleBorder space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-red-600" />
        <h2 className="text-lg font-bold text-hospital-navy">Plan Not Found</h2>
        <p className="text-sm text-hospital-greyText">{error || "Requested turnaround plan does not exist."}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-hospital-navy text-white hover:bg-hospital-navyHover"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isDelayed = plan.status.includes("DELAYED");
  const isInfeasible = plan.status.includes("INFEASIBLE");

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hospital-subtleBorder">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-hospital-greyText">
            <Link href="/" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link href="/history" className="hover:underline">Plan History</Link>
            <span>/</span>
            <span className="font-mono font-semibold text-hospital-navy">Plan #{plan.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hospital-navy">
              Generated Turnaround Plan
            </h1>
            <StatusBadge status={plan.status} size="lg" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/reports/${plan.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-md border border-hospital-subtleBorder bg-white text-hospital-navy hover:bg-hospital-lightGrey transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Final Report</span>
          </Link>
          <a
            href={api.getCsvDownloadUrl(plan.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-hospital-navy text-white hover:bg-hospital-navyHover transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {/* High-Level Feasibility Summary Banner */}
      <div
        className={`p-5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isInfeasible
            ? "bg-hospital-softRed border-red-300 text-red-950"
            : isDelayed
            ? "bg-hospital-softRed border-red-200 text-red-900"
            : "bg-hospital-softGreen border-emerald-200 text-emerald-950"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isInfeasible ? (
              <ShieldAlert className="w-5 h-5 text-red-700" />
            ) : isDelayed ? (
              <Clock className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
            <h2 className="text-base font-bold">
              {isInfeasible
                ? "INFEASIBLE – RESOURCE CONSTRAINT DETECTED"
                : isDelayed
                ? `SURGERY DELAYED BY ${plan.delay_minutes} MINUTES`
                : "SURGERY CAN COMMENCE ON TIME"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm opacity-90">
            {isInfeasible
              ? "One or more critical tasks cannot proceed because required qualified staff are unavailable."
              : isDelayed
              ? `Calculated OT and patient readiness is ${formatTimeOnly(plan.calculated_start_time)}, which exceeds scheduled start ${formatTimeOnly(plan.next_scheduled_time)}.`
              : `Theatre turnaround will conclude at ${formatTimeOnly(plan.calculated_start_time)}, on or before scheduled start ${formatTimeOnly(plan.next_scheduled_time)}.`}
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-black/10 pt-3 md:pt-0 md:pl-6 text-xs">
          <div>
            <span className="block opacity-75 font-medium">Turnaround Time</span>
            <span className="text-base font-bold font-mono">
              {formatDuration(plan.turnaround_duration)}
            </span>
          </div>
          <div>
            <span className="block opacity-75 font-medium">OT Ready Time</span>
            <span className="text-base font-bold font-mono">
              {formatTimeOnly(plan.ot_ready_time)}
            </span>
          </div>
          <div>
            <span className="block opacity-75 font-medium">Calculated Start</span>
            <span className="text-base font-bold font-mono">
              {formatTimeOnly(plan.calculated_start_time)}
            </span>
          </div>
        </div>
      </div>

      {/* Staff Conflicts Alert Box (if any) */}
      {plan.staff_conflicts && plan.staff_conflicts.length > 0 && (
        <div className="p-4 bg-hospital-softRed border border-red-300 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-red-900 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span>Staff Availability & Resource Conflicts ({plan.staff_conflicts.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-red-950">
            {plan.staff_conflicts.map((c, i) => (
              <div key={i} className="p-2.5 bg-white/70 rounded border border-red-200">
                <span className="font-semibold text-red-900">{c.task_name}</span>: {c.conflict_description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Gantt Chart Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-lg font-bold text-hospital-navy">Turnaround Timeline (Gantt Chart)</h2>
          </div>
          <span className="text-xs text-hospital-greyText hidden sm:inline">
            Interactive Forward Schedule Projection
          </span>
        </div>

        <GanttChart
          tasks={plan.task_schedules}
          parallelTasks={plan.parallel_tasks}
          previousSurgeryEnd={plan.previous_surgery_end}
        />
      </div>

      {/* Detailed Schedule Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-lg font-bold text-hospital-navy">Detailed Activity Schedule</h2>
          </div>
          <span className="text-xs text-hospital-greyText font-mono">
            {plan.task_schedules.length} Sequential & Parallel Stages
          </span>
        </div>

        <div className="rounded-lg border border-hospital-subtleBorder bg-white shadow-subtle overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-hospital-lightGrey/80 border-b border-hospital-subtleBorder text-hospital-greyText font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Dependencies</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hospital-subtleBorder">
              {plan.task_schedules.map((task) => {
                const isInfeasibleTask = task.task_status.toLowerCase().includes("infeasible");
                return (
                  <tr
                    key={task.task_id}
                    className={`hover:bg-hospital-lightGrey/40 transition-colors ${
                      isInfeasibleTask ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-hospital-navy">
                      {task.task_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-hospital-navy">
                      {task.task_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-hospital-greyText">
                      {formatTimeOnly(task.start_time)}
                    </td>
                    <td className="py-3 px-4 font-mono text-hospital-greyText">
                      {formatTimeOnly(task.end_time)}
                    </td>
                    <td className="py-3 px-4 font-medium text-hospital-navy">
                      {task.duration_minutes > 0 ? `${task.duration_minutes} min` : "Milestone"}
                    </td>
                    <td className="py-3 px-4 text-hospital-greyText">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3 text-hospital-greyText" />
                        <span>{task.assigned_staff}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-hospital-greyText">
                      {task.dependencies || "None"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          isInfeasibleTask
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {task.task_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

