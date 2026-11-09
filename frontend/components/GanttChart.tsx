"use client";

import React from "react";
import { TaskSchedule, ParallelTask } from "@/types/planner";
import { formatTimeOnly } from "@/lib/utils";
import { Clock, Users, ArrowRight, Layers } from "lucide-react";

interface GanttChartProps {
  tasks: TaskSchedule[];
  parallelTasks?: ParallelTask[];
  previousSurgeryEnd?: string;
}

export default function GanttChart({ tasks, parallelTasks = [], previousSurgeryEnd }: GanttChartProps) {
  // Filter active tasks with valid durations and start times
  const activeTasks = tasks.filter(
    (t) => t.duration_minutes > 0 && t.start_time && t.end_time
  );

  if (activeTasks.length === 0) {
    return (
      <div className="p-8 text-center text-hospital-greyText bg-hospital-cardBg rounded-lg border border-hospital-subtleBorder">
        <Clock className="w-8 h-8 mx-auto text-hospital-greyText mb-2" />
        <p className="font-medium">No timeline data available for this plan configuration.</p>
      </div>
    );
  }

  // Determine timeline boundary timestamps
  const timestamps = activeTasks.flatMap((t) => [
    new Date(t.start_time!).getTime(),
    new Date(t.end_time!).getTime(),
  ]);

  if (previousSurgeryEnd) {
    timestamps.push(new Date(previousSurgeryEnd).getTime());
  }

  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const totalDurationMs = Math.max(maxTime - minTime, 60000); // at least 1 min

  // Helper to calculate percentage offset & width
  const getPosition = (startIso: string, endIso: string) => {
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const leftPct = Math.max(0, ((startMs - minTime) / totalDurationMs) * 100);
    const widthPct = Math.min(100 - leftPct, Math.max(3, ((endMs - startMs) / totalDurationMs) * 100));
    return { leftPct, widthPct };
  };

  // Generate 5 evenly spaced time markers for the timeline ruler
  const rulerTicks = [0, 0.25, 0.5, 0.75, 1.0].map((fraction) => {
    const tickTime = new Date(minTime + totalDurationMs * fraction);
    return tickTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  });

  return (
    <div className="space-y-4">
      {/* Parallel Tasks Overview Pill Bar */}
      {parallelTasks.length > 0 && (
        <div className="p-3 bg-hospital-softBlue border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-4 h-4 text-hospital-navy flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-hospital-navy">
              Concurrent Parallel Tasks Detected ({parallelTasks.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {parallelTasks.map((p, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-white text-hospital-navy border border-blue-200 shadow-sm"
              >
                <span>{p.task_1_name}</span>
                <span className="text-blue-500 font-bold">||</span>
                <span>{p.task_2_name}</span>
                <span className="text-hospital-greyText text-[11px]">({p.overlap_minutes}m overlap)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gantt Timeline Container */}
      <div className="bg-white border border-hospital-subtleBorder rounded-lg p-4 shadow-subtle overflow-x-auto">
        {/* Timeline Header Time Ruler */}
        <div className="min-w-[640px]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-hospital-subtleBorder text-xs font-semibold text-hospital-greyText">
            <div className="w-1/3">Activity & Assigned Staff</div>
            <div className="w-2/3 flex justify-between px-2">
              {rulerTicks.map((tick, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="font-mono text-hospital-navy">{tick}</span>
                  <div className="w-px h-1.5 bg-hospital-subtleBorder mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Task Timeline Rows */}
          <div className="space-y-3">
            {activeTasks.map((task) => {
              const { leftPct, widthPct } = getPosition(task.start_time!, task.end_time!);
              const isInfeasible = task.task_status.toLowerCase().includes("infeasible");

              return (
                <div key={task.task_id} className="group flex items-center py-1 hover:bg-hospital-lightGrey/60 rounded px-1 transition-colors">
                  {/* Task Metadata Column */}
                  <div className="w-1/3 pr-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-hospital-lightGrey text-hospital-navy border border-hospital-subtleBorder">
                        {task.task_id}
                      </span>
                      <span className="text-xs font-medium text-hospital-navy truncate" title={task.task_name}>
                        {task.task_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-hospital-greyText">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-hospital-greyText" />
                        <span className="truncate max-w-[140px]">{task.assigned_staff}</span>
                      </span>
                      <span>•</span>
                      <span className="font-medium">{task.duration_minutes}m</span>
                    </div>
                  </div>

                  {/* Gantt Bar Track */}
                  <div className="w-2/3 relative h-8 bg-hospital-lightGrey/50 rounded flex items-center border border-hospital-subtleBorder">
                    {/* Visual Bar */}
                    <div
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                      className={`absolute h-6 rounded flex items-center justify-between px-2 text-[11px] text-white font-medium shadow-sm transition-all group-hover:brightness-110 ${
                        isInfeasible
                          ? "bg-red-600 border border-red-700"
                          : "bg-hospital-navy border border-hospital-navyHover"
                      }`}
                      title={`${task.task_name}: ${formatTimeOnly(task.start_time)} - ${formatTimeOnly(task.end_time)} (${task.duration_minutes} min)`}
                    >
                      <span className="font-mono text-[10px] hidden sm:inline">
                        {formatTimeOnly(task.start_time)}
                      </span>
                      <span className="truncate px-1 text-[11px] font-semibold">
                        {task.duration_minutes}m
                      </span>
                      <span className="font-mono text-[10px] hidden sm:inline">
                        {formatTimeOnly(task.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

