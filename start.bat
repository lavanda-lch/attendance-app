@echo off
chcp 65001 >nul
title Attendance App

echo ================================
echo   Attendance Clock-In App
echo ================================
echo.

set "PROJECT_DIR=%~dp0"

echo [1/2] Starting backend (:8765)...
start "Backend" cmd /c "cd /d "%PROJECT_DIR%backend" && python server.py"

echo [2/2] Starting frontend (:5173)...
start "Frontend" cmd /c "cd /d "%PROJECT_DIR%" && npm run dev"

echo.
echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo ================================
echo   Backend:  http://localhost:8765
echo   Frontend: http://localhost:5173
echo ================================
echo.
echo Close the "Backend" and "Frontend" windows to stop services.
echo.
pause
