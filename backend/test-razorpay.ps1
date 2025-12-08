# Test Razorpay Configuration
# This script tests if Razorpay credentials are configured correctly

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  TEST RAZORPAY CONFIGURATION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envFile = Join-Path $PSScriptRoot ".env"
if (!(Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this first:" -ForegroundColor Yellow
    Write-Host "  .\setup-razorpay.ps1" -ForegroundColor White
    Write-Host ""
    exit
}

# Read .env file
$envContent = Get-Content $envFile
$keyId = ""
$keySecret = ""

foreach ($line in $envContent) {
    if ($line -match "^RAZORPAY_KEY_ID=(.+)$") {
        $keyId = $matches[1]
    }
    if ($line -match "^RAZORPAY_KEY_SECRET=(.+)$") {
        $keySecret = $matches[1]
    }
}

Write-Host "📋 Checking Local Configuration:" -ForegroundColor Cyan
Write-Host ""

# Check Key ID
if ($keyId) {
    Write-Host "✅ RAZORPAY_KEY_ID found" -ForegroundColor Green
    Write-Host "   Value: $keyId" -ForegroundColor White
} else {
    Write-Host "❌ RAZORPAY_KEY_ID not found" -ForegroundColor Red
}

# Check Key Secret
if ($keySecret) {
    Write-Host "✅ RAZORPAY_KEY_SECRET found" -ForegroundColor Green
    Write-Host "   Value: $($keySecret.Substring(0, 8))..." -ForegroundColor White
} else {
    Write-Host "❌ RAZORPAY_KEY_SECRET not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ($keyId -and $keySecret) {
    Write-Host "✅ Local configuration is correct!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Add these same values to Vercel" -ForegroundColor White
    Write-Host "   2. See: ADD_RAZORPAY_TO_VERCEL.md" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Local configuration incomplete!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this to fix:" -ForegroundColor Yellow
    Write-Host "  .\setup-razorpay.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

