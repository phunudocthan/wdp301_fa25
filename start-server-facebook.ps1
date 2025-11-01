# Script to fix "Route not found" error for Facebook Login

Write-Host "🔧 Facebook Login - Route Fix Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env has Facebook config
Write-Host "📝 Step 1: Checking .env configuration..." -ForegroundColor Yellow
$envPath = ".\server\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match "FACEBOOK_APP_ID" -and $envContent -match "FACEBOOK_APP_SECRET") {
        Write-Host "✅ Facebook configuration found in .env" -ForegroundColor Green
    } else {
        Write-Host "❌ Facebook configuration NOT found in .env" -ForegroundColor Red
        Write-Host "⚠️  You need to add:" -ForegroundColor Yellow
        Write-Host "   FACEBOOK_APP_ID=your_app_id" -ForegroundColor Gray
        Write-Host "   FACEBOOK_APP_SECRET=your_app_secret" -ForegroundColor Gray
        Write-Host "   FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check current processes on port 5000
Write-Host "📝 Step 2: Checking port 5000..." -ForegroundColor Yellow
$portInUse = netstat -ano | findstr ":5000"

if ($portInUse) {
    Write-Host "⚠️  Port 5000 is in use" -ForegroundColor Yellow
    Write-Host "Attempting to kill process..." -ForegroundColor Yellow
    
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Processes stopped" -ForegroundColor Green
} else {
    Write-Host "✅ Port 5000 is available" -ForegroundColor Green
}

Write-Host ""

# Step 3: Start server
Write-Host "📝 Step 3: Starting server..." -ForegroundColor Yellow
Write-Host ""

Set-Location .\server

Write-Host "🚀 Server is starting on http://localhost:5000" -ForegroundColor Cyan
Write-Host "🔗 Facebook OAuth: http://localhost:5000/auth/facebook" -ForegroundColor Cyan
Write-Host "🔗 Alternative: http://localhost:5000/api/auth/facebook" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start
