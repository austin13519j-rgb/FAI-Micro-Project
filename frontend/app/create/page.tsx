"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { PlanCreatePayload } from "@/types/planner";

export default function CreatePlanPage() {
  const router = useRouter();

  // Form State
  const [prevEnd, setPrevEnd] = useState("10:30");
  const [nextSched, setNextSched] = useState("11:30");
  const [patientReady, setPatientReady] = useState("11:15");

  const [cleaningProtocol, setCleaningProtocol] = useState("Normal cleaning");
  const [cleaningDuration, setCleaningDuration] = useState(20);

  const [sterilDuration, setSterilDuration] = useState(30);
  const [waitingDuration, setWaitingDuration] = useState(10);

  const [restockDuration, setRestockDuration] = useState(15);
  const [setupDuration, setSetupDuration] = useState(15);
  const [transferDuration, setTransferDuration] = useState(10);

  const [staffAvail, setStaffAvail] = useState<Record<string, boolean>>({
    "Cleaning Staff": true,
    "Sterilisation Staff": true,
    "OT Nurse": true,
    "Support Staff": true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick preset loader (Normal vs Deep cleaning)
  const handleProtocolChange = (protocol: string) => {
    setCleaningProtocol(protocol);
    if (protocol === "Deep cleaning") {
      setCleaningDuration(50);
    } else {
      setCleaningDuration(20);
    }
  };

  const handleStaffToggle = (role: string) => {
    setStaffAvail((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic date parsing using today's date
    const today = new Date().toISOString().split("T")[0];
    const prevDate = new Date(`${today}T${prevEnd}:00`);
    const nextDate = new Date(`${today}T${nextSched}:00`);
    const patientDate = new Date(`${today}T${patientReady}:00`);

    if (nextDate <= prevDate) {
      setErrorMsg("Next surgery scheduled time must be strictly later than previous surgery completion time.");
      return;
    }

    const payload: PlanCreatePayload = {
      previous_surgery_end: prevDate.toISOString(),
      next_scheduled_time: nextDate.toISOString(),
      patient_ready_time: patientDate.toISOString(),
      cleaning_protocol: cleaningProtocol,
      cleaning_duration: Number(cleaningDuration),
      sterilisation_duration: Number(sterilDuration),
      waiting_duration: Number(waitingDuration),
      restocking_duration: Number(restockDuration),
      setup_duration: Number(setupDuration),
      transfer_duration: Number(transferDuration),
      staff_availability: staffAvail,
    };

    setIsSubmitting(true);
    try {
      const plan = await api.createPlan(payload);
      router.push(`/plan/${plan.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate plan. Please verify backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-hospital-subtleBorder">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hospital-navy">
          Create Turnaround Plan
        </h1>
        <p className="mt-1 text-sm text-hospital-greyText">
          Configure surgical timeline parameters, sanitation protocols, and staff availability to run the Forward Planning Agent.
        </p>
      </div>

      {/* Validation / API Error */}
      {errorMsg && (
        <div className="p-4 rounded-md bg-hospital-softRed border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A: SURGERY DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-hospital-subtleBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hospital-subtleBorder">
            <Clock className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-base font-semibold text-hospital-navy">
              A. Surgery Timeline Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Previous Surgery End Time
              </label>
              <input
                type="time"
                value={prevEnd}
                onChange={(e) => setPrevEnd(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Turnaround planning start point
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Next Surgery Scheduled Time
              </label>
              <input
                type="time"
                value={nextSched}
                onChange={(e) => setNextSched(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Target scheduled incision start
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Patient Pre-op Ready Time
              </label>
              <input
                type="time"
                value={patientReady}
                onChange={(e) => setPatientReady(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Patient ready in holding bay
              </span>
            </div>
          </div>
        </div>

        {/* SECTION B: CLEANING DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-hospital-subtleBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hospital-subtleBorder">
            <Sparkles className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-base font-semibold text-hospital-navy">
              B. Theatre Cleaning Protocol
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Protocol Selection
              </label>
              <select
                value={cleaningProtocol}
                onChange={(e) => handleProtocolChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              >
                <option value="Normal cleaning">Normal cleaning (Standard 20 min)</option>
                <option value="Deep cleaning">Deep cleaning (Terminal 50 min)</option>
              </select>
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Deep cleaning required for infectious or long procedures
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Cleaning Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={cleaningDuration}
                onChange={(e) => setCleaningDuration(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Customizable duration (min: 5, max: 180)
              </span>
            </div>
          </div>
        </div>

        {/* SECTION C: STERILISATION DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-hospital-subtleBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hospital-subtleBorder">
            <ShieldCheck className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-base font-semibold text-hospital-navy">
              C. Instrument Sterilisation & Mandatory Waiting
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Sterilisation Cycle Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={sterilDuration}
                onChange={(e) => setSterilDuration(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Autoclave / instrument reprocessing time
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Mandatory Cooling / Waiting Time (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={waitingDuration}
                onChange={(e) => setWaitingDuration(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Mandatory safety waiting time; cannot be bypassed
              </span>
            </div>
          </div>
        </div>

        {/* SECTION D: OT PREPARATION */}
        <div className="bg-white p-6 rounded-lg border border-hospital-subtleBorder shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hospital-subtleBorder">
            <Calendar className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-base font-semibold text-hospital-navy">
              D. OT Restocking, Setup & Patient Transfer
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Restocking Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={restockDuration}
                onChange={(e) => setRestockDuration(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Replenishing consumables in OT
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Instrument Setup Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={setupDuration}
                onChange={(e) => setSetupDuration(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Nurse preparing sterile surgical field
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hospital-navy mb-1">
                Patient Transfer Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={transferDuration}
                onChange={(e) => setTransferDuration(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy focus:outline-none focus:ring-1 focus:ring-hospital-navy"
              />
              <span className="text-[11px] text-hospital-greyText mt-0.5 block">
                Transfer from pre-op to OT table
              </span>
            </div>
          </div>
        </div>

        {/* SECTION E: STAFF AVAILABILITY */}
        <div className="bg-white p-6 rounded-lg border border-hospital-subtleBorder shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-hospital-subtleBorder">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-hospital-navy" />
              <h2 className="text-base font-semibold text-hospital-navy">
                E. Staff Roster & Duty Availability
              </h2>
            </div>
            <span className="text-xs text-hospital-greyText">
              Unchecked staff triggers qualification substitution or resource conflict
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.keys(staffAvail).map((role) => {
              const isChecked = staffAvail[role];
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => handleStaffToggle(role)}
                  className={`p-3.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isChecked
                      ? "bg-hospital-softGreen border-emerald-300 text-hospital-navy"
                      : "bg-hospital-softRed border-red-300 text-red-900"
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block">{role}</span>
                    <span className="text-[11px] text-hospital-greyText">
                      {isChecked ? "On Duty (Available)" : "Absent / Unavailable"}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center text-white ${
                      isChecked ? "bg-emerald-600" : "bg-red-500"
                    }`}
                  >
                    {isChecked ? <CheckCircle2 className="w-3.5 h-3.5" /> : "✕"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-hospital-greyText">
            The forward planning engine will schedule each task respecting precedence and resource constraints.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 rounded-md bg-hospital-navy text-white text-sm font-semibold hover:bg-hospital-navyHover shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calculating Forward Schedule...</span>
              </>
            ) : (
              <>
                <span>GENERATE TURNAROUND PLAN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

