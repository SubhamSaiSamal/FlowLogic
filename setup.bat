@echo off
echo.
echo ========================================
echo   FlowLogic Quick Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo This script will help you set up your Supabase credentials.
echo You can find these at: https://app.supabase.com/project/_/settings/api
echo.
echo.

REM Run the setup script
node setup.js

pause
