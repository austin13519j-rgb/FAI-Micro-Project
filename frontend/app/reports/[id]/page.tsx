"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Activity,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { FinalReportSummary } from "@/types/planner";
import { formatDuration } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export default function FinalReportPage() {
  const params = useParams();
  const planId = params.id as string;

  const [report, setReport] = useState<FinalReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;

    setIsLoading(true);
    setError(null);
    api
      .getFinalReport(planId)
      .then((data) => setReport(data))
      .catch((err) => setError(err.message || "Failed to load report summary."))
      .finally(() => setIsLoading(false));
  }, [planId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Activity className="w-8 h-8 mx-auto animate-spin text-hospital-navy mb-3" />
        <h2 className="text-base font-semibold text-hospital-navy">Generating Official Audit Report...</h2>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-hospital-cardBg rounded-lg border border-hospital-subtleBorder space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-red-600" />
        <h2 className="text-lg font-bold text-hospital-navy">Report Not Found</h2>
        <p className="text-sm text-hospital-greyText">{error || "Could not generate report for the requested plan."}</p>
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hospital-subtleBorder print:hidden">
        <Link
          href={`/plan/${report.plan_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-hospital-greyText hover:text-hospital-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plan #{report.plan_id}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-md border border-hospital-subtleBorder bg-white text-hospital-navy hover:bg-hospital-lightGrey transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <a
            href={api.getCsvDownloadUrl(report.plan_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-hospital-navy text-white hover:bg-hospital-navyHover transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Official Medical Report Document */}
      <div className="bg-white border border-hospital-subtleBorder rounded-lg p-8 shadow-subtle space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hospital-subtleBorder">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-hospital-greyText">
              Official Medical Capacity Audit
            </span>
            <h1 className="text-2xl font-bold text-hospital-navy mt-1">
              Operation Theatre Turnaround Report
            </h1>
            <p className="text-xs text-hospital-greyText mt-0.5">
              Plan Record Reference: #{report.plan_id} • Generated: {report.created_at}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-hospital-greyText block mb-1">Operational Outcome</span>
            <StatusBadge status={report.status} size="lg" />
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder">
            <span className="text-xs font-medium text-hospital-greyText">Turnaround Duration</span>
            <p className="text-xl font-bold text-hospital-navy mt-1">
              {formatDuration(report.total_turnaround_duration)}
            </p>
          </div>

          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder">
            <span className="text-xs font-medium text-hospital-greyText">Delay Time</span>
            <p className={`text-xl font-bold mt-1 ${report.delay_minutes > 0 ? "text-red-600" : "text-emerald-700"}`}>
              {report.delay_minutes > 0 ? `+${report.delay_minutes} min` : "0 min"}
            </p>
          </div>

          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder">
            <span className="text-xs font-medium text-hospital-greyText">OT Preparation</span>
            <p className="text-xl font-bold text-hospital-navy font-mono mt-1">
              {report.ot_ready_time}
            </p>
          </div>

          <div className="p-4 rounded-md bg-hospital-lightGrey border border-hospital-subtleBorder">
            <span className="text-xs font-medium text-hospital-greyText">Calculated Start</span>
            <p className="text-xl font-bold text-hospital-navy font-mono mt-1">
              {report.calculated_start_time}
            </p>
          </div>
        </div>

        {/* Detailed Surgical Operational Metrics */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-hospital-navy border-b border-hospital-subtleBorder pb-2">
            Timeline Milestone Breakdown
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="flex justify-between py-2 border-b border-hospital-lightGrey">
              <span className="text-hospital-greyText">Previous Surgery Completion Time:</span>
              <span className="font-mono font-semibold text-hospital-navy">{report.previous_surgery_end}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-hospital-lightGrey">
              <span className="text-hospital-greyText">Next Scheduled Surgery Time:</span>
              <span className="font-mono font-semibold text-hospital-navy">{report.next_scheduled_time}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-hospital-lightGrey">
              <span className="text-hospital-greyText">Patient Pre-operative Readiness:</span>
              <span className="font-mono font-semibold text-hospital-navy">{report.patient_ready_time}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-hospital-lightGrey">
              <span className="text-hospital-greyText">Sanitation Protocol Applied:</span>
              <span className="font-semibold text-hospital-navy">{report.cleaning_protocol}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-hospital-lightGrey">
              <span className="text-hospital-greyText">OT Environment Readiness Time:</span>
              <span className="font-mono font-semibold text-hospital-navy">{report.ot_ready_time}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-hospital-lightGrey">
              <span className="text-hospital-greyText">Earliest Feasible Incision Start:</span>
              <span className="font-mono font-semibold text-hospital-navy">{report.calculated_start_time}</span>
            </div>
          </div>
        </div>

        {/* Staff Availability Conflicts Audit */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-hospital-navy border-b border-hospital-subtleBorder pb-2">
            Staff Availability & Resource Conflict Audit
          </h2>

          {report.staff_conflicts && report.staff_conflicts.length > 0 ? (
            <div className="space-y-2">
              {report.staff_conflicts.map((conflict, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md bg-hospital-softRed border border-red-200 text-xs text-red-950 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-900">{conflict.task_name}</span> (Missing: {conflict.missing_role})
                    <p className="mt-0.5">{conflict.conflict_description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-md bg-hospital-softGreen border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                All required staff roles (Cleaning, Sterilisation, OT Nurse, Support Staff) were fully qualified and available. Zero double-booking detected.
              </span>
            </div>
          )}
        </div>

        {/* Sign-off Footnote */}
        <div className="pt-6 border-t border-hospital-subtleBorder text-xs text-hospital-greyText flex flex-col sm:flex-row justify-between gap-2">
          <p>Generated by Deterministic Forward Planning Agent Engine • First-Year B.Tech AI & Data Science</p>
          <p className="font-mono">Reference Hash: PLAN-{report.plan_id}-{report.created_at.replace(/[: -]/g, "")}</p>
        </div>
      </div>
    </div>
  );
}

