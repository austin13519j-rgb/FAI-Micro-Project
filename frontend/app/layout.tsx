import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Operation Theatre Turnaround Planner",
  description: "Hospital Operations & Capacity Planning using Forward Planning Agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-hospital-navy antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-hospital-subtleBorder bg-hospital-lightGrey/50 py-6 text-xs text-hospital-greyText">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-medium text-hospital-navy">
              Operation Theatre Turnaround Planner • Forward Planning Agent
            </p>
            <p className="text-hospital-greyText">
              B.Tech Artificial Intelligence & Data Science • Course Outcomes: CO2, CO4, CO5
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

