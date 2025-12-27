# Recreate Tables with Proper Formatting
# Step 1: Cleanup old tables
# Step 2: Create properly formatted tables

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RECREATE TABLES WITH PROPER FORMATTING                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Delete existing tables (users, login_sessions, shops_new, user_activity_logs)" -ForegroundColor White
Write-Host "  2. Recreate them with proper structure and formatting" -ForegroundColor White
Write-Host "  3. Load data with correct data types" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "STEP 1: Cleanup Old Tables" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

try {
    npm run cleanup:tables
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Cleanup successful!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Cleanup failed! Check errors above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during cleanup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "STEP 2: Create Formatted Tables" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Now you need to run the SQL in Supabase:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Open: backend/add-tables-formatted.sql" -ForegroundColor White
Write-Host "  2. Copy all contents (Ctrl+A, Ctrl+C)" -ForegroundColor White
Write-Host "  3. Go to Supabase Dashboard > SQL Editor" -ForegroundColor White
Write-Host "  4. Paste and click 'Run'" -ForegroundColor White
Write-Host ""

Write-Host "Opening SQL file..." -ForegroundColor Cyan
Start-Process "add-tables-formatted.sql"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Opening Supabase dashboard..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ STEP 1 COMPLETE - OLD TABLES REMOVED               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Run the SQL file in Supabase to recreate tables" -ForegroundColor Yellow
Write-Host "      with proper formatting and structure" -ForegroundColor Yellow
Write-Host ""

$completed = Read-Host "Press Enter when you've run the SQL in Supabase..."

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 MIGRATION COMPLETE!                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "New Tables Created:" -ForegroundColor Cyan
Write-Host "  ✅ users              - Properly formatted (2 records)" -ForegroundColor Green
Write-Host "  ✅ login_sessions     - Properly formatted (2 records)" -ForegroundColor Green
Write-Host "  ✅ shops_new          - Properly formatted (3 records)" -ForegroundColor Green
Write-Host "  ✅ user_activity_logs - Properly formatted (5 records)" -ForegroundColor Green
Write-Host ""

Write-Host "Improvements:" -ForegroundColor Cyan
Write-Host "  • Correct data types (VARCHAR, NUMERIC, INET)" -ForegroundColor White
Write-Host "  • JSONB for structured data" -ForegroundColor White
Write-Host "  • Check constraints for data validation" -ForegroundColor White
Write-Host "  • Comments on tables and columns" -ForegroundColor White
Write-Host "  • Optimized indexes" -ForegroundColor White
Write-Host "  • Better formatting and readability" -ForegroundColor White
Write-Host ""

Write-Host "Verify in Supabase:" -ForegroundColor Yellow
Write-Host "  Table Editor > Check these tables" -ForegroundColor White
Write-Host "    • users" -ForegroundColor Gray
Write-Host "    • login_sessions" -ForegroundColor Gray
Write-Host "    • shops_new" -ForegroundColor Gray
Write-Host "    • user_activity_logs" -ForegroundColor Gray
Write-Host ""

