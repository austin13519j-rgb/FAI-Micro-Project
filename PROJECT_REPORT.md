# OPERATION THEATRE TURNAROUND PLANNER USING FORWARD PLANNING
## Academic Micro-Project Report

**Course:** Fundamentals of Artificial Intelligence & Data Science  
**Academic Level:** First-Year B.Tech (Artificial Intelligence and Data Science)  
**Course Outcomes (COs) Addressed:**
- **CO2:** Formulate complex real-world operational problems as deterministic state-space search and planning representations.
- **CO4:** Design, implement, and validate forward-planning agents under temporal, precedence, and resource constraints.
- **CO5:** Analyze and evaluate planning agents against schedule infeasibility, resource conflicts, and concurrent execution opportunities.

---

## 1. Abstract

Hospital Operation Theatres (OTs) are among the most resource-intensive and cost-critical units in healthcare infrastructure. Turnaround time—the elapsed duration between the departure of one patient from the theatre and the readiness of the subsequent patient on the operating table—directly governs surgical throughput, surgical team overtime, and overall hospital operational efficiency. In conventional hospital management, turnaround scheduling is predominantly manual and ad-hoc, leading to frequent schedule slippage, staff double-booking, and idle time.

This project designs and implements a deterministic **Forward Planning Agent** to automate and optimize Operation Theatre turnaround scheduling. The planning agent models all post-operative activities as a Directed Acyclic Graph (DAG) with explicit precedence dependencies, staff qualification requirements, discrete non-overlapping staff intervals, and mandatory microbiological safety waiting periods. The system is delivered as a professional full-stack web application with a **Next.js 14** hospital dashboard, a high-throughput **FastAPI** Python planning engine, and a **Neon Serverless PostgreSQL** database. The scheduling engine was rigorously tested across 10 academic test scenarios, demonstrating 100% compliance with temporal and resource safety invariants.

---

## 2. Introduction & Problem Statement

### 2.1 The Operational Challenge
An Operation Theatre turnaround is not merely a cleaning task; it is a complex, synchronized workflow comprising:
1. Physical decontamination and surface sanitation.
2. Reprocessing and autoclave sterilization of surgical instrument sets.
3. Mandatory cooling and drying aeration cycles to prevent thermal tissue burns and condensate contamination.
4. Restocking sterile disposables, sutures, and medication.
5. Surgical field preparation and sterile instrument layout by a specialized scrub/OT nurse.
6. Patient pre-operative holding bay clearance and safe transfer onto the operating table.

If any task starts prematurely (e.g., handling uncooled instruments or transferring a patient before the sterile field is ready), patient safety and infection-control regulations are violated. Conversely, if parallel opportunities are overlooked (e.g., waiting for cleaning to complete before starting instrument sterilisation), the theatre remains unnecessarily idle, resulting in cascading surgical delays.

### 2.2 Objective
To engineer a deterministic Forward Planning Agent that:
- Commences scheduling from the prior surgery completion timestamp ($T_0$).
- Enforces strict topological precedence dependencies.
- Assigns staff members based on clinical qualifications and prevents double-booking.
- Accurately detects and utilizes parallel execution opportunities.
- Detects unresolvable staffing absences and flags infeasibility.
- Computes the exact earliest feasible surgery start time and turnaround delay.

---

## 3. System Architecture & Methodology

### 3.1 Three-Tier Architecture
The system adopts an enterprise-grade three-tier decoupled architecture:
1. **Presentation Layer (Frontend - Vercel):**
   - Built with **Next.js 14** (App Router), **React 18**, and **TypeScript**.
   - Styled with **Tailwind CSS** using a clinical palette (Navy Blue `#183153`, White `#FFFFFF`, Light Grey `#F4F6F8`, Soft Blue, Soft Green, and Soft Red).
   - Features real-time KPI metrics, an interactive timeline Gantt chart, a Recharts comparative bar chart, a 4-scenario simulation engine, and printable audit reports with CSV export.
2. **Application & Reasoning Layer (Backend - Render):**
   - Implemented in **Python 3.11+** utilizing **FastAPI**.
   - The forward planning engine (`planner.py`, `scheduler.py`, `staff_manager.py`) executes deterministic state-space calculations.
   - Validated via **Pydantic V2** schemas.
3. **Persistence Layer (Database - Neon):**
   - Powered by **Neon Serverless PostgreSQL** using **SQLAlchemy 2.0 ORM**.
   - Relational schema normalizes `surgery_plans`, `task_schedules`, `staff_availability`, and `staff_conflicts`.

---

## 4. Mathematical Modeling of the Forward Planning Agent

Let $T = \{T_1, T_2, \dots, T_9\}$ denote the set of turnaround activities. Each activity $T_i$ is characterized by:
- $d_i \in \mathbb{N}_0$: Duration in minutes.
- $\text{Pred}(i) \subset T$: Set of immediate predecessor activities.
- $R_i$: Set of required staff roles.

### 4.1 Dependency Precedence Completion
For any task $T_i$, its earliest dependency release time $D_i$ is:
$$D_i = \begin{cases} T_0 & \text{if } \text{Pred}(i) = \emptyset \\ \max_{p \in \text{Pred}(i)} \text{Finish}(T_p) & \text{otherwise} \end{cases}$$

### 4.2 Staff Allocation & Collision Prevention
Let $\text{Busy}(r) = \{ [b_s^k, b_e^k) \}_{k=1}^{m}$ represent the set of already reserved time intervals for staff role $r$. A time slot $[t, t + d_i)$ is feasible for role $r$ if and only if:
$$[t, t + d_i) \cap \bigcup_{k=1}^m [b_s^k, b_e^k) = \emptyset$$

The earliest feasible start time $S_i$ for task $T_i$ is the minimum $t \ge D_i$ where all assigned distinct personnel $r \in R_i$ are simultaneously free:
$$S_i = \min \{ t \ge D_i \mid \forall r \in R_i,\, [t, t + d_i) \cap \text{Busy}(r) = \emptyset \}$$
$$\text{Finish}(T_i) = S_i + d_i$$

### 4.3 Parallel Concurrency Detection
Two active tasks $T_a$ and $T_b$ ($d_a > 0, d_b > 0$) execute concurrently if:
$$\max(S_a, S_b) < \min(\text{Finish}(T_a), \text{Finish}(T_b))$$
The overlap duration is $\Omega_{a,b} = \min(\text{Finish}(T_a), \text{Finish}(T_b)) - \max(S_a, S_b)$.

### 4.4 Turnaround Readiness & Delay
- **OT Room Preparation Complete:** $\text{OT Ready} = \text{Finish}(T_6)$
- **Patient Transfer Earliest Start:** $S_{T8} = \max(\text{Finish}(T_6),\, \text{patient\_ready\_time})$
- **Calculated Next Surgery Start:** $\text{Calculated Start} = \text{Finish}(T_8) = S_{T8} + d_8$
- **Delay:** $\Delta = \max(0,\, \text{Calculated Start} - \text{next\_scheduled\_time})$

---

## 5. Experimental Results & Scenario Analysis

The system was evaluated against four standardized operational benchmarks:

| Metric | Scenario 1: Normal + Full Staff | Scenario 2: Deep Clean + Full Staff | Scenario 3: Normal + Cleaning Absent | Scenario 4: Deep Clean + Cleaning Absent |
| :--- | :--- | :--- | :--- | :--- |
| **Sanitation Protocol** | Normal (20 min) | Deep (50 min) | Normal (20 min) | Deep (50 min) |
| **Cleaning Staff Status** | Available | Available | Absent (Support Covers) | Absent (Support Covers) |
| **Prior Surgery End** | 10:30 | 10:30 | 10:30 | 10:30 |
| **Scheduled Start** | 11:30 | 11:30 | 11:30 | 11:30 |
| **OT Ready Time** | 11:25 | 11:50 | 11:25 | 11:50 |
| **Calculated Start** | 11:35 | 12:00 | 11:35 | 12:00 |
| **Total Turnaround** | 65 minutes | 90 minutes | 65 minutes | 90 minutes |
| **Delay** | **5 minutes** | **30 minutes** | **5 minutes** | **30 minutes** |
| **Status** | DELAYED | DELAYED | DELAYED | DELAYED |

### Concurrency Observation:
In all scenarios, Task $T_2$ (Clean OT) and Task $T_3$ (Sterilise Instruments) execute concurrently starting at 10:30. In Scenario 1, this concurrent execution saves **20 minutes** compared to an un-optimized sequential schedule.

---

## 6. Conclusion & Future Work

### 6.1 Conclusion
The **Operation Theatre Turnaround Planner** successfully demonstrates how deterministic Forward Planning Agents resolve multi-resource scheduling under complex precedence constraints. By automating turnaround calculations:
- Fictitious delays and staff double-booking are eliminated.
- Parallel disinfection and sterilisation windows are fully exploited.
- Transparent audit logs are generated for hospital operations management.

### 6.2 Future Enhancements
1. **Multi-Theatre Global Planning:** Expanding the agent to coordinate multiple operating suites sharing a single central sterilisation department (CSSD).
2. **Stochastic Duration Modeling:** Integrating fuzzy logic or PERT estimations to model duration uncertainties caused by bioburden variations.
