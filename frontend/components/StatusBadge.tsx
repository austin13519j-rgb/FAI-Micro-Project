import React from "react";
import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  const normStatus = (status || "").toUpperCase();

  const isCompleted = normStatus === "ON TIME" || normStatus === "COMPLETED";
  const isDelayed = normStatus.includes("DELAYED");
  const isInfeasible = normStatus.includes("INFEASIBLE") || normStatus.includes("CONFLICT");

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm",
    lg: "px-3.5 py-1.5 text-sm sm:text-base font-semibold",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-hospital-softGreen text-emerald-800 border border-emerald-200 ${sizeClasses[size]} ${className}`}
      >
        <CheckCircle className={`${iconSizes[size]} text-emerald-600 flex-shrink-0`} />
        <span>{status}</span>
      </span>
    );
  }

  if (isDelayed) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-hospital-softRed text-red-800 border border-red-200 ${sizeClasses[size]} ${className}`}
      >
        <Clock className={`${iconSizes[size]} text-red-600 flex-shrink-0`} />
        <span>{status}</span>
      </span>
    );
  }

  if (isInfeasible) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-hospital-softRed text-red-900 border border-red-300 ${sizeClasses[size]} ${className}`}
      >
        <AlertTriangle className={`${iconSizes[size]} text-red-700 flex-shrink-0`} />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-hospital-lightGrey text-hospital-greyText border border-hospital-subtleBorder ${sizeClasses[size]} ${className}`}
    >
      <XCircle className={`${iconSizes[size]} text-hospital-greyText flex-shrink-0`} />
      <span>{status || "Unknown"}</span>
    </span>
  );
}

