"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  PlusCircle,
  GitCompare,
  History,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import { api } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .checkHealth()
      .then((res) => {
        if (isMounted) setIsBackendHealthy(res.status === "healthy");
      })
      .catch(() => {
        if (isMounted) setIsBackendHealthy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const navLinks = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Create Plan", href: "/create", icon: PlusCircle },
    { label: "Scenario Comparison", href: "/scenarios", icon: GitCompare },
    { label: "Plan History", href: "/history", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-hospital-subtleBorder shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-hospital-navy flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base tracking-tight text-hospital-navy">
                  OT Turnaround Planner
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-hospital-softBlue text-hospital-navy">
                  Forward Planning Agent
                </span>
              </div>
              <p className="text-xs text-hospital-greyText hidden sm:block">
                Hospital Operations • Capacity Management
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-hospital-softBlue text-hospital-navy font-semibold"
                      : "text-hospital-greyText hover:text-hospital-navy hover:bg-hospital-lightGrey"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-hospital-navy" : "text-hospital-greyText"}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Backend Status Indicator */}
          <div className="flex items-center">
            {isBackendHealthy === null ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs bg-hospital-lightGrey text-hospital-greyText">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Connecting</span>
              </div>
            ) : isBackendHealthy ? (
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-hospital-softGreen text-emerald-800"
                title="Python FastAPI Backend Connected"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">FastAPI Active</span>
              </div>
            ) : (
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-hospital-softRed text-red-800"
                title="Backend offline. Verify FastAPI server on port 8000."
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Backend Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

