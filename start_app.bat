@echo off
title Operation Theatre Turnaround Planner Launcher
echo =====================================================================
echo    OPERATION THEATRE TURNAROUND PLANNER - LOCAL LAUNCHER
echo    First-Year B.Tech AI & Data Science Micro-Project (CO2, CO4, CO5)
echo =====================================================================
echo.

set ROOT_DIR=%~dp0
set NODE_PATH=D:\nodejs

echo [1/3] Adding Node.js runtime to PATH...
set PATH=%NODE_PATH%;%PATH%

echo [2/3] Launching FastAPI Backend on http://localhost:8000 ...
start "OT Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%backend" && set DISABLE_SQLALCHEMY_CEXT=1 && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo [3/3] Launching Next.js Frontend on http://localhost:3000 ...
start "OT Frontend (Next.js)" cmd /k "cd /d "%ROOT_DIR%frontend" && set PATH=%NODE_PATH%;%%PATH%% && npm run dev"

echo.
echo =====================================================================
echo  Both services are starting!
echo  - Frontend: http://localhost:3000
echo  - Backend:  http://localhost:8000
echo  - API Docs: http://localhost:8000/docs
echo =====================================================================
echo.
timeout /t 5 >nul
start http://localhost:3000

