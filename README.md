# Operation Theatre Turnaround Planner

A professional full-stack hospital capacity planning and turnaround scheduling system driven by a deterministic **Forward Planning Agent**.

Designed and implemented for **First-Year B.Tech Artificial Intelligence and Data Science** (Course Outcomes: **CO2, CO4, CO5**).

---

## 1. Project Overview

- **Project Title:** Operation Theatre Turnaround Planner Using Forward Planning
- **Industry Domain:** Hospital Operations, Surgical Suite Capacity Planning & Resource Allocation
- **Course Outcomes:**
  - **CO2:** Formulate complex operational problems as deterministic state-space planning problems.
  - **CO4:** Implement search and forward-planning agents under temporal, precedence, and resource constraints.
  - **CO5:** Evaluate AI planning agents, identify schedule infeasibilities, and optimize parallel execution.

In modern surgical suites, Operation Theatre (OT) turnaround time—the interval between one patient leaving the theatre and the subsequent patient being ready on the operating table—is a primary operational bottleneck. Delays propagate into subsequent surgical schedules, leading to surgeon overtime, escalated hospital overheads, and compromised patient care.

This application replaces ad-hoc scheduling with a deterministic **Forward Planning Agent** that models tasks, precedence relationships, staff qualifications, mandatory cooling/waiting periods, and discrete busy intervals to compute the mathematically earliest feasible surgical start time.

---

## 2. Technology Stack

### Frontend (Deployable to Vercel)
- **Framework:** Next.js 14 (App Router)
- **Library:** React 18, TypeScript
- **Styling:** Tailwind CSS with a strict hospital aesthetic (White `#FFFFFF`, Navy Blue `#183153`, Light Grey `#F4F6F8`, Soft Blue `#EAF1F8`, Soft Green `#E7F4EA`, Soft Red `#FCE8E6`, Grey Text `#667085`)
- **Visualizations:** Recharts (Duration comparison bar charts), Custom Gantt timeline renderer
- **Icons:** Lucide React

### Backend (Deployable to Render)
- **Language:** Python 3.11+
- **API Framework:** FastAPI with asynchronous lifespan management
- **Data Validation:** Pydantic V2
- **ORM & Data Layer:** SQLAlchemy 2.0 with connection pooling
- **Scheduling Calculations:** Python `datetime` and `timedelta`
- **Testing:** Pytest (15 unit and integration tests)

### Database (Hosted on Neon)
- **Database Engine:** Neon Serverless PostgreSQL
- **Connection Management:** SQLAlchemy with SSL support (`sslmode=require`), pre-ping validation, and connection recycling
- **Local Fallback:** Automatic SQLite fallback (`sqlite:///./ot_planner.db`) for offline development or local demonstration without cloud credentials

---

## 3. Forward Planning Engine Architecture

The Forward Planning Agent progressively constructs an operational timeline starting from the timestamp when the prior surgery finishes ($T_0 = \text{previous\_surgery\_end}$).

```
  [T1: Prior Surgery End]
         |
         +-----------------------+
         |                       |
  [T2: Clean OT]         [T3: Sterilise Instruments]
         |                       |
  [T5: Restock OT]       [T4: Mandatory Cooling Wait]
         |                       |
         +-----------+-----------+
                     |
         [T6: Set Up Instruments]  <--- OT Preparation Complete
                     |
         +-----------+-----------+
         |                       |
  [OT Ready (T6)]        [T7: Patient Ready in Pre-op]
         |                       |
         +-----------+-----------+
                     |
         [T8: Patient Transfer to OT]
                     |
         [T9: Confirm Readiness & Handover]
                     |
           (Calculated Start Time)
```

### Precedence Graph & Task Rules

| Task ID | Task Description | Dependencies | Required Staff Role | Qualifications / Substitutes |
| :--- | :--- | :--- | :--- | :--- |
| **T1** | Complete Previous Surgery | None ($T_0$) | None | External milestone |
| **T2** | Clean Operation Theatre | T1 | Cleaning Staff | Primary: Cleaning Staff; Backup: Support Staff |
| **T3** | Sterilise Surgical Instruments | T1 | Sterilisation Staff | Primary: Sterilisation Staff; Backup: OT Nurse |
| **T4** | Mandatory Sterilisation Waiting | T3 | None | Passive cooling cycle (cannot be bypassed) |
| **T5** | Restock Operation Theatre | T2 | Support Staff | Primary: Support Staff; Backup: Cleaning Staff |
| **T6** | Set Up Surgical Instruments | T4, T5 | OT Nurse | Primary: OT Nurse (clinical; no non-nurse substitute) |
| **T7** | Check Patient Readiness | None | None | External milestone (pre-op holding bay) |
| **T8** | Transfer Patient to OT | T6, T7 | Support Staff & OT Nurse | Both roles required concurrently |
| **T9** | Confirm OT Readiness & Handover| T8 | OT Nurse | Final handover milestone |

### Mathematical Scheduling Formulas

1. **Precedence Completion Time ($D_i$):**
   $$D_i = \max_{p \in \text{deps}(i)} (\text{Finish}(p))$$

2. **Staff Assignment & Earliest Feasible Start ($S_i$):**
   $$S_i = \min \{ t \ge D_i \mid \forall r \in \text{Roles}(i),\, \text{is\_free}(r, t, t + \text{Duration}(i)) \}$$

3. **OT Readiness Time:**
   $$\text{OT Ready Time} = \text{Finish}(\text{T6})$$

4. **Patient Transfer Earliest Start:**
   $$S_{\text{T8}} = \max(\text{Finish}(\text{T6}),\, \text{patient\_ready\_time})$$

5. **Calculated Surgery Start Time:**
   $$\text{Calculated Start} = \text{Finish}(\text{T8})$$

6. **Delay Calculation:**
   $$\text{Delay} = \max(0,\, \text{Calculated Start} - \text{next\_scheduled\_time})$$

7. **Status Determination:**
   - If any required role has no available candidate: `INFEASIBLE - RESOURCE CONSTRAINT`
   - Else if $\text{Delay} > 0$: `DELAYED`
   - Else: `ON TIME`

---

## 4. Folder Structure

```
OT_Turnaround_Planner/
│
├── backend/
│   ├── main.py              # FastAPI application & REST endpoints
│   ├── planner.py           # Forward planning agent & scenario logic
│   ├── scheduler.py         # Forward task scheduler & parallel detection
│   ├── cleaning.py          # Cleaning protocol logic & validation
│   ├── sterilisation.py     # Sterilisation & mandatory cooling constraints
│   ├── staff_manager.py     # Staff roster, qualifications & interval booking
│   ├── report.py            # Summary generator & CSV exporter
│   ├── database.py          # SQLAlchemy connection & engine setup
│   ├── models.py            # Database entity models
│   ├── schemas.py           # Pydantic request & response models
│   ├── crud.py              # Database query operations
│   ├── requirements.txt     # Python backend dependencies
│   ├── .env.example         # Backend environment variables template
│   └── tests/
│       ├── test_planner.py  # 10 core academic planning unit tests
│       └── test_api.py      # REST API integration tests
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with hospital navbar & footer
│   │   ├── globals.css      # Tailwind directives & theme reset
│   │   ├── page.tsx         # PAGE 1: Dashboard
│   │   ├── create/
│   │   │   └── page.tsx     # PAGE 2: Create Turnaround Plan
│   │   ├── plan/
│   │   │   └── [id]/page.tsx# PAGE 3: Generated Plan & Gantt Chart
│   │   ├── scenarios/
│   │   │   └── page.tsx     # PAGE 4: Scenario Comparison
│   │   ├── reports/
│   │   │   └── [id]/page.tsx# PAGE 5: Final Medical Audit Report
│   │   └── history/
│   │       └── page.tsx     # PAGE 6: Plan History & Filtering
│   ├── components/
│   │   ├── Navbar.tsx       # Navigation header with live health check
│   │   ├── GanttChart.tsx   # Interactive timeline Gantt chart
│   │   └── StatusBadge.tsx  # Color-coded status badge
│   ├── lib/
│   │   ├── api.ts           # Centralized API service
│   │   └── utils.ts         # Formatting utilities
│   ├── types/
│   │   └── planner.ts       # TypeScript interface definitions
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── next.config.mjs
│   └── .env.example
│
├── render.yaml              # Render blueprint for backend service
├── .gitignore
└── README.md
```

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Step 1: Start the Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (runs SQLite automatically if DATABASE_URL is not set)
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be available at: `http://127.0.0.1:8000`  
Swagger UI documentation: `http://127.0.0.1:8000/docs`

### Step 2: Start the Frontend (Next.js)

In a new terminal window:

```bash
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```
The frontend dashboard will be available at: `http://localhost:3000`

---

## 6. Running the Test Suite

All 15 unit and API integration tests can be verified using Pytest:

```bash
cd backend
python -m pytest tests/test_planner.py tests/test_api.py -v
```

### Verified Test Cases:
1. `test_1_normal_cleaning_all_staff`: Normal cleaning (20 min) with all staff available.
2. `test_2_deep_cleaning_all_staff`: Deep cleaning (50 min) schedule calculation.
3. `test_3_cleaning_staff_unavailable`: Support Staff substitution for Cleaning Staff.
4. `test_4_sterilisation_staff_unavailable`: OT Nurse cross-coverage for Sterilisation.
5. `test_5_ot_nurse_unavailable`: Infeasibility due to missing specialized clinical role.
6. `test_6_patient_readiness_delayed`: Patient transfer held until patient is ready in pre-op.
7. `test_7_sterilisation_waiting_time`: Enforces mandatory cooling period before instrument setup.
8. `test_8_multiple_simultaneous_tasks`: Verifies parallel execution of cleaning and sterilisation.
9. `test_9_staff_double_booking_prevention`: Ensures a single staff member is never booked simultaneously.
10. `test_10_infeasible_resource_allocation`: Detects complete staffing exhaustion.
11. `test_health_check`: REST API health probe.
12. `test_create_and_get_plan`: Database persistence and retrieval.
13. `test_compare_scenarios`: Execution of all 4 scenarios.
14. `test_dashboard_stats`: Dynamic KPI aggregation from database records.
15. `test_report_and_csv_download`: Compliant CSV download endpoint.

---

## 7. Cloud Deployment Guide

### A. Database Deployment on Neon
1. Log in to [Neon Console](https://console.neon.tech/).
2. Create a new project (e.g., `ot-turnaround-db`).
3. Select **PostgreSQL 16**.
4. In the Dashboard, copy the connection string:
   ```text
   postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Neon connection pooling is supported out-of-the-box by SQLAlchemy's `pool_pre_ping=True` and `pool_recycle=300`.

### B. Backend Deployment on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your Git repository containing this project.
4. Configure service settings:
   - **Name:** `ot-turnaround-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string from Step A)*
   - `FRONTEND_ORIGIN`: *(Your deployed Vercel frontend URL, e.g. `https://ot-turnaround-planner.vercel.app`)*
6. Click **Deploy Web Service**.
7. Test the health endpoint: `https://your-backend.onrender.com/health`.

### C. Frontend Deployment on Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Select your Git repository.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, configure:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com`
6. Click **Deploy**.
7. Once deployed, copy your Vercel URL and add it as the `FRONTEND_ORIGIN` environment variable in your Render backend settings.

---

## 8. Academic Evaluation Summary

| Academic Requirement | Implementation Method |
| :--- | :--- |
| **Deterministic Forward Planning** | Forward discrete-interval state-space search starting from $T_0$ |
| **Resource Double-Booking Prevention** | Interval collision checks for each individual staff member |
| **Parallel Task Optimization** | Concurrency detection for independent graph nodes ($T_2 \parallel T_3$, $T_4 \parallel T_5$) |
| **Mandatory Safety Protocols** | Enforced cooling delays preventing premature setup of sterile fields |
| **Infeasibility Detection** | Explicit identification of unresolvable staffing shortages with conflict auditing |
| **Relational Database Storage** | Normalised PostgreSQL tables in Neon storing plans, tasks, roster, and conflicts |

