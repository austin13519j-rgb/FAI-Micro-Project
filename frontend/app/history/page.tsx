"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Clock,
  Layers,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { SurgeryPlan } from "@/types/planner";
import { formatTimeOnly, formatDateTime, formatDuration } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export default function PlanHistoryPage() {
  const [plans, setPlans] = useState<SurgeryPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPlans = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getAllPlans({
        search: searchTerm || undefined,
        status_filter: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setPlans(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to retrieve history from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlans();
  };

  const handleDelete = async (planId: number) => {
    if (!window.confirm(`Are you sure you want to delete Plan #${planId}?`)) return;
    try {
      await api.deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err: any) {
      alert(`Could not delete plan: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hospital-subtleBorder">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hospital-navy">
            Plan History & Audit Log
          </h1>
          <p className="mt-1 text-sm text-hospital-greyText">
            All previously calculated turnaround plans retrieved from Neon Serverless PostgreSQL.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-hospital-subtleBorder bg-white text-hospital-navy hover:bg-hospital-lightGrey transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-md bg-hospital-softRed border border-red-200 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={fetchPlans} className="text-xs font-semibold underline text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-lg border border-hospital-subtleBorder shadow-subtle">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-hospital-greyText absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by protocol or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-hospital-greyText" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON TIME">On Time</option>
            <option value="DELAYED">Delayed</option>
            <option value="INFEASIBLE">Infeasible (Resource Conflict)</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-lg border border-hospital-subtleBorder bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-hospital-greyText">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-hospital-navy mb-2" />
            <p className="text-sm font-medium">Fetching historical records from database...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-16 text-center text-hospital-greyText space-y-2">
            <History className="w-10 h-10 mx-auto text-hospital-greyText opacity-60" />
            <h3 className="text-base font-semibold text-hospital-navy">No records found</h3>
            <p className="text-xs text-hospital-greyText">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search query or status filter."
                : "No turnaround plans have been computed yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-hospital-lightGrey/80 border-b border-hospital-subtleBorder text-hospital-greyText font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Plan ID</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Prior End</th>
                  <th className="py-3 px-4">Scheduled</th>
                  <th className="py-3 px-4">Calc Start</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Delay</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hospital-subtleBorder">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-hospital-lightGrey/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-hospital-navy">
                      #{p.id}
                    </td>
                    <td className="py-3.5 px-4 text-hospital-greyText text-xs">
                      {formatDateTime(p.created_at)}
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
                    <td className="py-3.5 px-4 font-mono">
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/plan/${p.id}`}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-hospital-softBlue text-hospital-navy hover:bg-hospital-navy hover:text-white transition-colors"
                        >
                          View Schedule
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1 text-hospital-greyText hover:text-red-600 transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

