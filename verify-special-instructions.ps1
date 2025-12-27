# Verify Special Instructions Fix
# Run this after executing the SQL in Supabase

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Verify Special Instructions Fix" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This script will help you verify the fix worked.`n" -ForegroundColor White

# Step 1: Check if SQL was run
Write-Host "STEP 1: Did you run the SQL in Supabase SQL Editor?" -ForegroundColor Yellow
Write-Host "The SQL adds the 'special_instructions' column to 'orders' table.`n" -ForegroundColor Gray
$sqlRun = Read-Host "Have you run the SQL? (y/n)"

if ($sqlRun -ne "y" -and $sqlRun -ne "Y") {
    Write-Host "`n❌ Please run the SQL first!" -ForegroundColor Red
    Write-Host "Open: FIX_SPECIAL_INSTRUCTIONS_ERROR.md" -ForegroundColor Yellow
    Write-Host "Or: ADD_INSTRUCTIONS_FIELD.sql`n" -ForegroundColor Yellow
    exit
}

# Step 2: Check if schema was reloaded
Write-Host "`nSTEP 2: Did you reload the PostgREST schema cache?" -ForegroundColor Yellow
Write-Host "In Supabase Dashboard → Settings → API → Click 'Reload Schema'`n" -ForegroundColor Gray
$schemaReloaded = Read-Host "Have you reloaded the schema? (y/n)"

if ($schemaReloaded -ne "y" -and $schemaReloaded -ne "Y") {
    Write-Host "`n⚠️  Schema reload is CRITICAL!" -ForegroundColor Yellow
    Write-Host "Without it, PostgREST won't see the new column.`n" -ForegroundColor Gray
    Write-Host "Go to: Supabase → Settings → API → Reload Schema`n" -ForegroundColor Cyan
    exit
}

# Step 3: Restart app
Write-Host "`nSTEP 3: Restart your Expo app with cleared cache..." -ForegroundColor Yellow
Write-Host "Running: npx expo start --clear`n" -ForegroundColor Gray

$confirmation = Read-Host "Press Enter to restart the app (or 'n' to skip)"

if ($confirmation -ne "n" -and $confirmation -ne "N") {
    Write-Host "`n🔄 Restarting Expo..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx expo start --clear"
    Start-Sleep -Seconds 2
}

# Instructions
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ✅ READY TO TEST!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Test Steps:" -ForegroundColor White
Write-Host "1. Add items to cart" -ForegroundColor Gray
Write-Host "2. Go to Checkout" -ForegroundColor Gray
Write-Host "3. Add special instructions: 'Test delivery'" -ForegroundColor Gray
Write-Host "4. Place order (COD or Online)" -ForegroundColor Gray
Write-Host "5. ✅ Order should be created successfully" -ForegroundColor Green
Write-Host "6. Go to Orders tab and view the order" -ForegroundColor Gray
Write-Host "7. ✅ Should see your instructions displayed`n" -ForegroundColor Green

Write-Host "If you still get the error:" -ForegroundColor Yellow
Write-Host "- Double-check the SQL ran successfully" -ForegroundColor Gray
Write-Host "- Make sure you reloaded the schema cache" -ForegroundColor Gray
Write-Host "- Try running 'NOTIFY pgrst, ""reload schema"";' in Supabase SQL" -ForegroundColor Gray
Write-Host "- Check backend Vercel logs for errors`n" -ForegroundColor Gray

Write-Host "========================================`n" -ForegroundColor Cyan

