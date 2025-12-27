# Setup Razorpay Credentials
# This script creates the .env file with Razorpay credentials

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  RAZORPAY SETUP SCRIPT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".env"

# Check if .env already exists
if (Test-Path $envFile) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit
    }
}

# Create .env file with Razorpay credentials
$envContent = @"
# Razorpay Test API Credentials
RAZORPAY_KEY_ID=rzp_test_RkgC2RZSP1gZNW
RAZORPAY_KEY_SECRET=ivWo5qTwct9dCsKlCG43NhCS

# Supabase Configuration
SUPABASE_URL=https://xflbcpmqtdpvofqnqzhs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmbGJjcG1xdGRwdm9mcW5xemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxOTA1MzAsImV4cCI6MjA0Nzc2NjUzMH0.x-hzthMKjw-0DGqYQbCYd00MBCvN_qJB3lRIZnODr84
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmbGJjcG1xdGRwdm9mcW5xemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjE5MDUzMCwiZXhwIjoyMDQ3NzY2NTMwfQ.MRQyJNKZfaUo-ZXW0pGNMhGm53xXUhP9KGLCZr03lhg

# JWT Secret for authentication
JWT_SECRET=taza-secret-key-2024

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
"@

# Write to file
$envContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Razorpay Credentials Added:" -ForegroundColor Cyan
Write-Host "   Key ID: rzp_test_RkgC2RZSP1gZNW" -ForegroundColor White
Write-Host "   Key Secret: ivWo5qTwct9dCsKlCG43NhCS" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Add these same credentials to Vercel environment variables" -ForegroundColor White
Write-Host "   2. Restart your backend server if it's running" -ForegroundColor White
Write-Host "   3. Test payment flow in the app" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

