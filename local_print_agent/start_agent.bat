@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo 🚀 Starting VayuPos Local Print Agent...

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH. Please install Python.
    pause
    exit /b 1
)

:: Create Virtual Environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Virtual Environment...
    python -m venv venv
)

:: Activate venv and install dependencies
echo 🛠️  Installing/Updating Dependencies...
call venv\Scripts\activate
pip install -r requirements.txt

:: Run the agent
echo 📡 Agent is now running. Keep this window open.
python agent.py

pause
