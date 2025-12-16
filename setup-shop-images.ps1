# ============================================================
# Setup Script for Shop Images Fix
# This script helps set up the image upload functionality
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Shop Images Fix - Setup Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-Not (Test-Path "vendor -app")) {
    Write-Host "ERROR: 'vendor -app' folder not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Step 1: Install Dependencies in Vendor App
Write-Host "[Step 1/4] Installing dependencies in vendor app..." -ForegroundColor Green
Write-Host ""

Set-Location "vendor -app"

Write-Host "Running: npm install" -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Step 2: Display Supabase Storage Setup Instructions
Write-Host "[Step 2/4] Supabase Storage Setup" -ForegroundColor Green
Write-Host ""
Write-Host "You need to create storage buckets in Supabase." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option A: Run SQL Migration (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Open Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  2. Go to SQL Editor" -ForegroundColor White
Write-Host "  3. Copy contents from:" -ForegroundColor White
Write-Host "     supabase/migrations/20250120000002_create_storage_buckets.sql" -ForegroundColor Yellow
Write-Host "  4. Paste and run in SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "Option B: Manual Setup" -ForegroundColor Cyan
Write-Host "  Follow detailed guide in: SETUP_SUPABASE_STORAGE.md" -ForegroundColor White
Write-Host ""

$response = Read-Host "Have you created the storage buckets? (y/n)"
if ($response -ne "y") {
    Write-Host ""
    Write-Host "Please set up storage buckets first, then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening setup guide..." -ForegroundColor Cyan
    Start-Process "SETUP_SUPABASE_STORAGE.md"
    exit 0
}

Write-Host "✅ Storage buckets confirmed!" -ForegroundColor Green
Write-Host ""

# Step 3: Verify Supabase Configuration
Write-Host "[Step 3/4] Verifying Supabase Configuration" -ForegroundColor Green
Write-Host ""

# Check customer app .env
if (Test-Path ".env") {
    Write-Host "✅ Customer app .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "EXPO_PUBLIC_SUPABASE_URL") {
        Write-Host "✅ EXPO_PUBLIC_SUPABASE_URL is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  EXPO_PUBLIC_SUPABASE_URL not found in .env" -ForegroundColor Yellow
    }
    if ($envContent -match "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
        Write-Host "✅ EXPO_PUBLIC_SUPABASE_ANON_KEY is set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Customer app .env file not found" -ForegroundColor Yellow
}

Write-Host ""

# Check vendor app .env
if (Test-Path "vendor -app/.env") {
    Write-Host "✅ Vendor app .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vendor app .env file not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Display Next Steps
Write-Host "[Step 4/4] Next Steps" -ForegroundColor Green
Write-Host ""
Write-Host "Setup is complete! Here's what to do next:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test Vendor App:" -ForegroundColor White
Write-Host "   - Open vendor app" -ForegroundColor Gray
Write-Host "   - Register a new shop with photos" -ForegroundColor Gray
Write-Host "   - Check console logs for upload success messages" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify in Supabase:" -ForegroundColor White
Write-Host "   - Go to Storage → shop-images bucket" -ForegroundColor Gray
Write-Host "   - Check that photos are uploaded" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test Customer App:" -ForegroundColor White
Write-Host "   - Open customer app" -ForegroundColor Gray
Write-Host "   - Navigate to home screen" -ForegroundColor Gray
Write-Host "   - Verify shop images are displayed" -ForegroundColor Gray
Write-Host ""
Write-Host "4. If Images Don't Display:" -ForegroundColor White
Write-Host "   - Check console logs for errors" -ForegroundColor Gray
Write-Host "   - Review: FIX_SHOP_IMAGES_SUMMARY.md" -ForegroundColor Gray
Write-Host "   - Review: SETUP_SUPABASE_STORAGE.md" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📄 Documentation Files Created:" -ForegroundColor Cyan
Write-Host "  - FIX_SHOP_IMAGES_SUMMARY.md (Overview)" -ForegroundColor White
Write-Host "  - SETUP_SUPABASE_STORAGE.md (Detailed guide)" -ForegroundColor White
Write-Host "  - supabase/migrations/20250120000002_create_storage_buckets.sql (SQL)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Code Files Modified:" -ForegroundColor Cyan
Write-Host "  - vendor -app/services/imageUpload.ts (New)" -ForegroundColor White
Write-Host "  - vendor -app/services/shops.ts (Modified)" -ForegroundColor White
Write-Host "  - vendor -app/package.json (Updated)" -ForegroundColor White
Write-Host "  - app/(tabs)/index.tsx (Modified)" -ForegroundColor White
Write-Host "  - app/(tabs)/orders.tsx (Modified)" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check the troubleshooting section in FIX_SHOP_IMAGES_SUMMARY.md" -ForegroundColor Yellow
Write-Host ""

