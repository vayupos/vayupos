# PowerShell script to start both backend and frontend servers

Write-Host "================================" -ForegroundColor Cyan
Write-Host "VayuPos Local Development Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get the script's directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"
$frontendDir = Join-Path $scriptDir "frontend"

Write-Host "📁 Backend directory: $backendDir" -ForegroundColor Green
Write-Host "📁 Frontend directory: $frontendDir" -ForegroundColor Green
Write-Host ""

# Check if directories exist
if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting VayuPos services..." -ForegroundColor Yellow
Write-Host ""

# Start backend in a new window/tab
Write-Host "1️⃣  Starting Backend Server (port 8000)..." -ForegroundColor Blue
Write-Host "   Command: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; & (venv\Scripts\Activate.ps1); python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Start frontend in a new window/tab
Write-Host ""
Write-Host "2️⃣  Starting Frontend Dev Server (port 8080)..." -ForegroundColor Blue
Write-Host "   Command: npm run dev" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Both servers should be starting..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Backend Docs:  http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "🎨 Frontend:      http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop the servers" -ForegroundColor Gray
Write-Host ""
Write-Host "Check the individual terminal windows for details..." -ForegroundColor Gray
