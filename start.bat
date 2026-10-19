@echo off
rem One-click launcher for the Garki Market prototype (Windows).
rem Needs Node.js 20.19+ (https://nodejs.org). First run installs the dependencies.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies - this only happens the first time...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting the prototype at http://127.0.0.1:5190  (press Ctrl+C to stop)
start "" cmd /c "timeout /t 4 >nul & start http://127.0.0.1:5190"
call npm run dev
