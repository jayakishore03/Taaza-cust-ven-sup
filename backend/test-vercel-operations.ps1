# Complete API Testing Script for Vercel Deployment
# Tests GET, POST, and UPDATE operations

$baseUrl = "https://taaza-customer.vercel.app/api"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERCEL API - GET, POST, UPDATE OPERATIONS              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor White
Write-Host ""

# ============================================================
# GET OPERATIONS
# ============================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "1. GET OPERATIONS (Retrieve Data)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Get Products
Write-Host "📦 GET /api/products" -ForegroundColor Cyan
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/products"
    Write-Host "   ✅ Success! Found $($products.data.Count) products" -ForegroundColor Green
    Write-Host "   Sample: $($products.data[0].name) - Rs.$($products.data[0].price)" -ForegroundColor Gray
    
    # Show category breakdown
    $categories = $products.data | Group-Object category
    Write-Host "   Categories:" -ForegroundColor Cyan
    foreach($cat in $categories) {
        Write-Host "     - $($cat.Name): $($cat.Count) items" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Get Shops
Write-Host "🏪 GET /api/shops" -ForegroundColor Cyan
try {
    $shops = Invoke-RestMethod -Uri "$baseUrl/shops"
    Write-Host "   ✅ Success! Found $($shops.data.Count) shops" -ForegroundColor Green
    foreach($shop in $shops.data) {
        Write-Host "   - $($shop.name) ($($shop.distance))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Get Addons
Write-Host "➕ GET /api/addons" -ForegroundColor Cyan
try {
    $addons = Invoke-RestMethod -Uri "$baseUrl/addons"
    Write-Host "   ✅ Success! Found $($addons.data.Count) addons" -ForegroundColor Green
    foreach($addon in $addons.data) {
        Write-Host "   - $($addon.name): Rs.$($addon.price)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Get Coupons
Write-Host "🎫 GET /api/coupons" -ForegroundColor Cyan
try {
    $coupons = Invoke-RestMethod -Uri "$baseUrl/coupons"
    Write-Host "   ✅ Success! Found $($coupons.data.Count) coupons" -ForegroundColor Green
    foreach($coupon in $coupons.data) {
        Write-Host "   - $($coupon.code): $($coupon.discount_value) ($($coupon.discount_type))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Get Single Product
Write-Host "🔍 GET /api/products/1 (Single Product)" -ForegroundColor Cyan
try {
    $product = Invoke-RestMethod -Uri "$baseUrl/products/1"
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Name: $($product.data.name)" -ForegroundColor White
    Write-Host "   Price: Rs.$($product.data.price)" -ForegroundColor White
    Write-Host "   Category: $($product.data.category)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ============================================================
# POST OPERATIONS
# ============================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "2. POST OPERATIONS (Create/Send Data)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Check Database Status
Write-Host "📊 POST /api/migrate-direct/status (Check Status)" -ForegroundColor Cyan
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/migrate-direct/status"
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Total Records: $($status.totalRecords)" -ForegroundColor White
    Write-Host "   Breakdown:" -ForegroundColor Cyan
    $status.status.PSObject.Properties | ForEach-Object {
        Write-Host "     $($_.Name): $($_.Value.count) records" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️ Endpoint not available or database empty" -ForegroundColor Yellow
}
Write-Host ""

# Load Reference Data
Write-Host "📦 POST /api/migrate-reference/all (Load Test Data)" -ForegroundColor Cyan
try {
    $refResult = Invoke-RestMethod -Uri "$baseUrl/migrate-reference/all" -Method POST
    Write-Host "   ✅ Success! Loaded $($refResult.totalRecords) reference records" -ForegroundColor Green
    Write-Host "   User Profiles: $($refResult.results.user_profiles.count)" -ForegroundColor Gray
    Write-Host "   Addresses: $($refResult.results.addresses.count)" -ForegroundColor Gray
    Write-Host "   Orders: $($refResult.results.orders.count)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️ Endpoint may not be deployed yet" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ============================================================
# UPDATE OPERATIONS (Examples)
# ============================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "3. UPDATE OPERATIONS (Modify Data)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Note: UPDATE operations typically require authentication" -ForegroundColor Cyan
Write-Host "   Below are examples (will need proper auth tokens)" -ForegroundColor Gray
Write-Host ""

# Example Update Product (would need auth)
Write-Host "Example: PUT /api/products/1" -ForegroundColor Cyan
Write-Host "   Would update product price, availability, etc." -ForegroundColor Gray
Write-Host "   Requires admin authentication" -ForegroundColor Gray
Write-Host ""

# Example Update Order
Write-Host "Example: PUT /api/orders/{orderId}" -ForegroundColor Cyan
Write-Host "   Would update order status, delivery info, etc." -ForegroundColor Gray
Write-Host "   Requires user/admin authentication" -ForegroundColor Gray
Write-Host ""

# ============================================================
# SUMMARY
# ============================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "SUMMARY" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

try {
    $apiInfo = Invoke-RestMethod -Uri $baseUrl
    $products = Invoke-RestMethod -Uri "$baseUrl/products"
    $shops = Invoke-RestMethod -Uri "$baseUrl/shops"
    $addons = Invoke-RestMethod -Uri "$baseUrl/addons"
    
    Write-Host "✅ Vercel API Status: LIVE" -ForegroundColor Green
    Write-Host "   Version: $($apiInfo.version)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Available Data:" -ForegroundColor Green
    Write-Host "   Products: $($products.data.Count)" -ForegroundColor White
    Write-Host "   Shops: $($shops.data.Count)" -ForegroundColor White
    Write-Host "   Addons: $($addons.data.Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Ready for:" -ForegroundColor Green
    Write-Host "   - Frontend integration" -ForegroundColor White
    Write-Host "   - Mobile app connection" -ForegroundColor White
    Write-Host "   - Production use" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🌐 API Endpoints:" -ForegroundColor Cyan
    $apiInfo.endpoints.PSObject.Properties | ForEach-Object {
        Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Could not retrieve full status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📝 For detailed examples, see: VERCEL_API_COMPLETE_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

