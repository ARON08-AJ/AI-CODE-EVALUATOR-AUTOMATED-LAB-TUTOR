@echo off
title AutoLab Database Studio
color 0B

echo ==========================================================
echo        AutoLab Prisma Studio Database GUI
echo ==========================================================
echo.
echo Launching Prisma Studio at http://localhost:5555...
echo Press Ctrl+C in this window when you want to stop it.
echo.

cd server
timeout /t 2 /nobreak >nul
start http://localhost:5555
call npx prisma studio
pause
