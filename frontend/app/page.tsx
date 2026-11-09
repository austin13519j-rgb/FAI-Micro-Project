"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { DashboardStats } from "@/types/planner";
import { formatTimeOnly, formatDateTime, formatDuration } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hospital-subtleBorder">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hospital-navy">
            Operation Theatre Turnaround Planner
          </h1>
          <p className="mt-1 text-sm text-hospital-greyText">
            Hospital Operations Capacity Planning & Forward Scheduling Agent
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-hospital-subtleBorder text-hospital-greyText hover:text-hospital-navy hover:bg-hospital-lightGrey transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-hospital-navy text-white hover:bg-hospital-navyHover shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Turnaround Plan</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-md bg-hospital-softRed border border-red-200 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs font-semibold underline text-red-900 hover:text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Plans */}
        <div className="p-5 rounded-lg border border-hospital-subtleBorder bg-hospital-cardBg shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-hospital-greyText">
              Total Surgery Plans
            </span>
            <div className="p-2 rounded-md bg-hospital-softBlue text-hospital-navy">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-hospital-navy">
              {isLoading ? "--" : stats?.total_plans ?? 0}
            </span>
            <span className="text-xs text-hospital-greyText font-medium">Recorded</span>
          </div>
          <p className="mt-2 text-xs text-hospital-greyText">Forward schedules generated</p>
        </div>

        {/* Metric 2: On-Time Surgeries */}
        <div className="p-5 rounded-lg border border-hospital-subtleBorder bg-hospital-cardBg shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-hospital-greyText">
              On-Time Surgeries
            </span>
            <div className="p-2 rounded-md bg-hospital-softGreen text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-800">
              {isLoading ? "--" : stats?.on_time_count ?? 0}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {stats?.total_plans && stats.total_plans > 0
                ? `${Math.round((stats.on_time_count / stats.total_plans) * 100)}%`
                : "0%"}
            </span>
          </div>
          <p className="mt-2 text-xs text-hospital-greyText">Zero turnaround delay</p>
        </div>

        {/* Metric 3: Delayed Surgeries */}
        <div className="p-5 rounded-lg border border-hospital-subtleBorder bg-hospital-cardBg shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-hospital-greyText">
              Delayed Surgeries
            </span>
            <div className="p-2 rounded-md bg-hospital-softRed text-red-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-700">
              {isLoading ? "--" : stats?.delayed_count ?? 0}
            </span>
            <span className="text-xs text-red-600 font-medium">
              {stats?.total_plans && stats.total_plans > 0
                ? `${Math.round((stats.delayed_count / stats.total_plans) * 100)}%`
                : "0%"}
            </span>
          </div>
          <p className="mt-2 text-xs text-hospital-greyText">Preparation exceeded scheduled time</p>
        </div>

        {/* Metric 4: Average Turnaround */}
        <div className="p-5 rounded-lg border border-hospital-subtleBorder bg-hospital-cardBg shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-hospital-greyText">
              Avg Turnaround Time
            </span>
            <div className="p-2 rounded-md bg-hospital-softBlue text-hospital-navy">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-hospital-navy">
              {isLoading ? "--" : `${stats?.avg_turnaround_duration ?? 0}`}
            </span>
            <span className="text-xs text-hospital-greyText font-medium">Minutes</span>
          </div>
          <p className="mt-2 text-xs text-hospital-greyText">From prior finish to patient ready</p>
        </div>
      </div>

      {/* Operational Theatre Real-Time Status Card */}
      <div className="rounded-lg border border-hospital-subtleBorder bg-white p-6 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-hospital-subtleBorder">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-hospital-greyText">
              Live Theatre Status
            </span>
            <h2 className="text-xl font-bold text-hospital-navy mt-1">
              Latest Turnaround Assessment
            </h2>
          </div>
          <div>
            {isLoading ? (
              <span className="text-xs text-hospital-greyText">Checking status...</span>
            ) : (
              <StatusBadge status={stats?.current_ot_status || "IDLE / READY"} size="lg" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder">
            <span className="text-xs font-medium text-hospital-greyText">Next Scheduled Surgery</span>
            <p className="text-lg font-bold text-hospital-navy mt-1">
              {formatTimeOnly(stats?.next_scheduled_surgery)}
            </p>
            <p className="text-xs text-hospital-greyText mt-0.5">
              {stats?.next_scheduled_surgery ? formatDateTime(stats.next_scheduled_surgery) : "Awaiting schedule"}
            </p>
          </div>

          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder">
            <span className="text-xs font-medium text-hospital-greyText">Estimated OT Readiness</span>
            <p className="text-lg font-bold text-hospital-navy mt-1">
              {formatTimeOnly(stats?.estimated_ot_readiness)}
            </p>
            <p className="text-xs text-hospital-greyText mt-0.5">
              {stats?.estimated_ot_readiness ? "Cleaning & setup completed" : "No active turnaround"}
            </p>
          </div>

          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-hospital-greyText">Active Action</span>
              <p className="text-sm font-semibold text-hospital-navy mt-1">
                {stats?.latest_plan
                  ? `${stats.latest_plan.cleaning_protocol} (${stats.latest_plan.turnaround_duration} min)`
                  : "No recent plan created"}
              </p>
            </div>
            {stats?.latest_plan && (
              <Link
                href={`/plan/${stats.latest_plan.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-hospital-navy hover:underline mt-2"
              >
                <span>View Full Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Plans Table */}
      <div className="rounded-lg border border-hospital-subtleBorder bg-white shadow-subtle overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-hospital-subtleBorder">
          <div>
            <h2 className="text-lg font-bold text-hospital-navy">Recent Turnaround Plans</h2>
            <p className="text-xs text-hospital-greyText mt-0.5">
              Latest forward planning computations retrieved directly from Neon PostgreSQL
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-hospital-navy hover:underline inline-flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-hospital-greyText">
            <Activity className="w-6 h-6 mx-auto animate-spin text-hospital-navy mb-2" />
            <p className="text-sm">Loading recent plans from database...</p>
          </div>
        ) : !stats?.recent_plans || stats.recent_plans.length === 0 ? (
          <div className="py-12 text-center text-hospital-greyText">
            <Calendar className="w-8 h-8 mx-auto text-hospital-greyText mb-2" />
            <p className="text-sm font-medium">No turnaround plans found in database.</p>
            <p className="text-xs text-hospital-greyText mt-1">
              Create your first forward plan using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-hospital-lightGrey/80 border-b border-hospital-subtleBorder text-hospital-greyText font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Plan ID</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Prior End</th>
                  <th className="py-3 px-4">Scheduled</th>
                  <th className="py-3 px-4">Calc Start</th>
                  <th className="py-3 px-4">Turnaround</th>
                  <th className="py-3 px-4">Delay</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hospital-subtleBorder">
                {stats.recent_plans.map((p) => (
                  <tr key={p.id} className="hover:bg-hospital-lightGrey/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-hospital-navy">
                      #{p.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-hospital-navy">
                      {p.cleaning_protocol}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-hospital-greyText">
                      {formatTimeOnly(p.previous_surgery_end)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-hospital-greyText">
                      {formatTimeOnly(p.next_scheduled_time)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-hospital-navy">
                      {formatTimeOnly(p.calculated_start_time)}
                    </td>
                    <td className="py-3.5 px-4 text-hospital-greyText">
                      {formatDuration(p.turnaround_duration)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.delay_minutes > 0 ? (
                        <span className="font-semibold text-red-600">+{p.delay_minutes} min</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/plan/${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-hospital-softBlue text-hospital-navy hover:bg-hospital-navy hover:text-white transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

