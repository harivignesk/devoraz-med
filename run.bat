@echo off
echo ==========================================
echo       Starting MedSync AI Platform        
echo ==========================================
echo.

echo [1/3] Starting FastAPI Backend Server...
start "MedSync Backend" cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --reload"

echo [2/3] Starting Vite React Frontend Server...
start "MedSync Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak > NUL

echo.
echo Opening MedSync AI in your default web browser...
start http://localhost:5173/dashboard

echo.
echo ==========================================
echo MedSync AI is running! 
echo Close the newly opened terminal windows to stop the servers.
echo ==========================================
pause
