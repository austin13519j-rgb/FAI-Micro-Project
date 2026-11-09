"use client";

import React, { useState, useEffect } from "react";
import {
  GitCompare,
  Play,
  RefreshCw,
  Clock,
  Layers,
  AlertTriangle,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { ScenarioItem } from "@/types/planner";
import { formatTimeOnly } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export default function ScenarioComparisonPage() {
  // Base Inputs for Scenarios
  const [prevEnd, setPrevEnd] = useState("10:30");
  const [nextSched, setNextSched] = useState("11:30");
  const [patientReady, setPatientReady] = useState("11:15");

  const [sterilDuration, setSterilDuration] = useState(30);
  const [waitingDuration, setWaitingDuration] = useState(10);
  const [restockDuration, setRestockDuration] = useState(15);
  const [setupDuration, setSetupDuration] = useState(15);
  const [transferDuration, setTransferDuration] = useState(10);

  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAllScenarios = async () => {
    setIsRunning(true);
    setErrorMsg(null);

    const today = new Date().toISOString().split("T")[0];
    const prevDate = new Date(`${today}T${prevEnd}:00`);
    const nextDate = new Date(`${today}T${nextSched}:00`);
    const patientDate = new Date(`${today}T${patientReady}:00`);

    if (nextDate <= prevDate) {
      setErrorMsg("Next surgery scheduled time must be later than previous surgery completion time.");
      setIsRunning(false);
      return;
    }

    try {
      const resp = await api.compareScenarios({
        previous_surgery_end: prevDate.toISOString(),
        next_scheduled_time: nextDate.toISOString(),
        patient_ready_time: patientDate.toISOString(),
        sterilisation_duration: Number(sterilDuration),
        waiting_duration: Number(waitingDuration),
        restocking_duration: Number(restockDuration),
        setup_duration: Number(setupDuration),
        transfer_duration: Number(transferDuration),
      });
      setScenarios(resp.scenarios);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to run scenario calculations.");
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runAllScenarios();
  }, []);

  // Prepare chart data for Recharts
  const chartData = scenarios.map((s, idx) => ({
    name: `Scenario ${idx + 1}`,
    fullName: s.scenario_name,
    turnaround: s.turnaround_duration,
    delay: s.delay_minutes,
    status: s.status,
  }));

  const barColors = ["#183153", "#244570", "#D97706", "#DC2626"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hospital-subtleBorder">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-hospital-navy">
            Scenario Comparison Engine
          </h1>
          <p className="mt-1 text-sm text-hospital-greyText">
            Simulate and evaluate 4 operational scenarios under varying sanitation and staffing constraints.
          </p>
        </div>

        <button
          onClick={runAllScenarios}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-hospital-navy text-white text-sm font-semibold hover:bg-hospital-navyHover shadow-sm transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
          <span>{isRunning ? "Running Engine..." : "Rerun All Scenarios"}</span>
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-md bg-hospital-softRed border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Base Inputs Adjustment Panel */}
      <div className="p-5 rounded-lg border border-hospital-subtleBorder bg-white shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-hospital-subtleBorder">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-hospital-navy">
              Shared Base Inputs
            </h2>
          </div>
          <span className="text-xs text-hospital-greyText">
            Adjusting parameters updates all 4 scenarios simultaneously
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Prior End
            </label>
            <input
              type="time"
              value={prevEnd}
              onChange={(e) => setPrevEnd(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Scheduled
            </label>
            <input
              type="time"
              value={nextSched}
              onChange={(e) => setNextSched(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Patient Ready
            </label>
            <input
              type="time"
              value={patientReady}
              onChange={(e) => setPatientReady(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Sterilisation
            </label>
            <input
              type="number"
              min={5}
              value={sterilDuration}
              onChange={(e) => setSterilDuration(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Wait / Cool
            </label>
            <input
              type="number"
              min={0}
              value={waitingDuration}
              onChange={(e) => setWaitingDuration(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Restock
            </label>
            <input
              type="number"
              min={5}
              value={restockDuration}
              onChange={(e) => setRestockDuration(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Setup
            </label>
            <input
              type="number"
              min={5}
              value={setupDuration}
              onChange={(e) => setSetupDuration(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-hospital-navy mb-1">
              Transfer
            </label>
            <input
              type="number"
              min={5}
              value={transferDuration}
              onChange={(e) => setTransferDuration(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs rounded border border-hospital-subtleBorder bg-hospital-cardBg text-hospital-navy"
            />
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-lg border border-hospital-subtleBorder bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-hospital-subtleBorder flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-base font-bold text-hospital-navy">Scenario Outcomes Table</h2>
          </div>
          <span className="text-xs text-hospital-greyText font-mono">
            Deterministic Rule-Based Forward Calculations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-hospital-lightGrey/80 border-b border-hospital-subtleBorder text-hospital-greyText font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Scenario Configuration</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">OT Ready</th>
                <th className="py-3 px-4">Calculated Start</th>
                <th className="py-3 px-4">Turnaround Duration</th>
                <th className="py-3 px-4">Delay (min)</th>
                <th className="py-3 px-4">Staff Conflicts</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hospital-subtleBorder">
              {scenarios.map((s, idx) => (
                <tr key={idx} className="hover:bg-hospital-lightGrey/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-hospital-navy">
                    {s.scenario_name}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-hospital-greyText">
                    {s.cleaning_protocol}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-hospital-navy">
                    {formatTimeOnly(s.ot_ready_time)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-hospital-navy">
                    {formatTimeOnly(s.calculated_start)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-hospital-navy">
                    {s.turnaround_duration > 0 ? `${s.turnaround_duration} min` : "Infeasible"}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {s.delay_minutes > 0 ? (
                      <span className="font-bold text-red-600">+{s.delay_minutes} min</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">0 min</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-hospital-greyText">
                    {s.staff_conflicts_count > 0 ? (
                      <span className="text-red-700 font-medium">
                        {s.staff_conflicts_count} Conflict(s)
                      </span>
                    ) : (
                      <span className="text-emerald-700">None (Staffed)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recharts Bar Chart Visualizing Turnaround Durations */}
      <div className="rounded-lg border border-hospital-subtleBorder bg-white p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-hospital-subtleBorder">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-hospital-navy" />
            <h2 className="text-base font-bold text-hospital-navy">
              Turnaround Duration Comparison (Minutes)
            </h2>
          </div>
          <span className="text-xs text-hospital-greyText">
            Shorter bar indicates faster patient ready time
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#183153", fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: "#CBD5E1" }}
              />
              <YAxis
                unit="m"
                tick={{ fill: "#667085", fontSize: 11 }}
                axisLine={{ stroke: "#CBD5E1" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-md shadow-md border border-hospital-subtleBorder text-xs space-y-1">
                        <p className="font-bold text-hospital-navy">{data.fullName}</p>
                        <p className="text-hospital-greyText">
                          Turnaround: <span className="font-semibold text-hospital-navy">{data.turnaround} minutes</span>
                        </p>
                        <p className="text-hospital-greyText">
                          Delay: <span className="font-semibold text-red-600">{data.delay} minutes</span>
                        </p>
                        <p className="text-hospital-greyText">
                          Status: <span className="font-semibold">{data.status}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="turnaround" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

