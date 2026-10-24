@echo off
title AutoLab AI Programming Evaluator
color 0A

echo ==========================================================
echo        AutoLab AI Programming Lab Platform
echo ==========================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please download and install Node.js LTS from: https://nodejs.org/
    echo After installing, restart your command prompt or double-click this file again.
    echo.
    pause
    exit /b 1
)

:: 2. Verify npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in your PATH!
    pause
    exit /b 1
)

echo [1/5] Checking environment configuration...
if not exist "server\.env" (
    echo Creating server\.env from template...
    copy "server\.env.example" "server\.env" >nul
    echo server\.env created successfully.
)

echo [2/5] Checking root packages...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

echo [3/5] Checking server packages...
if not exist "server\node_modules\" (
    echo Installing backend dependencies...
    cd server
    call npm install
    cd ..
)

echo [4/5] Checking client packages...
if not exist "client\node_modules\" (
    echo Installing frontend dependencies...
    cd client
    call npm install
    cd ..
)

echo [5/5] Checking database initialization...
if not exist "server\prisma\dev.db" (
    echo Setting up database and running seed data...
    cd server
    call npx prisma db push
    call npx prisma db seed
    cd ..
) else (
    cd server
    call npx prisma generate
    cd ..
)

echo.
echo ==========================================================
echo All checks passed!
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Admin Login:   admin@college.edu       / admin123
echo Faculty Login: faculty@example.com     / password123
echo Student Login: 8115U23CS001            / 23CS001
echo ==========================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

npm run dev
