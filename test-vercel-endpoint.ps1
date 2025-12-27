# Quick Test - Verify Vercel API Endpoint
# This confirms your mobile app will connect successfully

$api = "https://taaza-customer.vercel.app/api"

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " TESTING VERCEL API FOR MOBILE APP" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint: $api" -ForegroundColor White
Write-Host ""

$allPassed = $true

# Test 1: Products
Write-Host "1. Testing Products..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$api/products" -TimeoutSec 10
    if ($products.data.Count -gt 0) {
        Write-Host "   ✅ SUCCESS - $($products.data.Count) products loaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WARNING - No products found" -ForegroundColor Yellow
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: Shops
Write-Host "2. Testing Shops..." -ForegroundColor Yellow
try {
    $shops = Invoke-RestMethod -Uri "$api/shops" -TimeoutSec 10
    if ($shops.data.Count -gt 0) {
        Write-Host "   ✅ SUCCESS - $($shops.data.Count) shops loaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WARNING - No shops found" -ForegroundColor Yellow
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Addons
Write-Host "3. Testing Addons..." -ForegroundColor Yellow
try {
    $addons = Invoke-RestMethod -Uri "$api/addons" -TimeoutSec 10
    if ($addons.data.Count -gt 0) {
        Write-Host "   ✅ SUCCESS - $($addons.data.Count) addons loaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WARNING - No addons found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 4: Database Status
Write-Host "4. Testing Database Status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$api/migrate-direct/status" -TimeoutSec 10
    if ($status.totalRecords -gt 0) {
        Write-Host "   ✅ SUCCESS - $($status.totalRecords) total records" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WARNING - Database empty" -ForegroundColor Yellow
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host " ✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your mobile app will work perfectly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Expected console output in Expo:" -ForegroundColor Cyan
    Write-Host "  🔗 API Base URL: https://taaza-customer.vercel.app/api" -ForegroundColor White
    Write-Host "  ✅ Loaded $($products.data.Count) products" -ForegroundColor White
    Write-Host "  ✅ Loaded $($shops.data.Count) shops" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart your Expo app: npm start" -ForegroundColor White
    Write-Host "  2. Check console for: https://taaza-customer.vercel.app/api" -ForegroundColor White
    Write-Host "  3. Watch app load data successfully!" -ForegroundColor White
} else {
    Write-Host " ❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  - Internet connection" -ForegroundColor White
    Write-Host "  - Vercel deployment status" -ForegroundColor White
    Write-Host "  - API endpoint URL is correct" -ForegroundColor White
}

Write-Host ""

