@echo off
title AI Code Evaluator & Automated Lab Tutor Launcher
echo ======================================================================
echo           AI Code Evaluator & Automated Lab Tutor
echo ======================================================================
echo Starting React Frontend Dev Server & Spring Boot Backend...
echo.

set PATH=C:\Users\aadhi\.gemini\antigravity\apache-maven-3.9.8\bin;C:\Program Files\nodejs;C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot\bin;%PATH%

echo Starting Spring Boot Backend Server on http://localhost:8080 ...
start "Spring Boot Backend (Port 8080)" /D "%~dp0backend" cmd /k "set PATH=C:\Users\aadhi\.gemini\antigravity\apache-maven-3.9.8\bin;C:\Program Files\nodejs;C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot\bin;%PATH% && mvn spring-boot:run"

echo Starting React Frontend Dev Server on http://localhost:5173 ...
start "React Frontend (Port 5173)" /D "%~dp0frontend" cmd /k "set PATH=C:\Program Files\nodejs;C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot\bin;%PATH% && node ""C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"" run dev"

echo.
echo Application documentation:
echo   - Frontend App: http://localhost:5173
echo   - OpenAPI Swagger UI: http://localhost:8080/swagger-ui.html
echo ======================================================================
pause
