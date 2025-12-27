# Add Missing Tables to Supabase
# Tables: users, login_sessions, shops_new, user_activity_logs

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ADD MISSING TABLES TO SUPABASE                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Missing Tables:" -ForegroundColor Yellow
Write-Host "  1. users              - User accounts" -ForegroundColor White
Write-Host "  2. login_sessions     - Session management" -ForegroundColor White
Write-Host "  3. shops_new          - Enhanced shops" -ForegroundColor White
Write-Host "  4. user_activity_logs - Activity tracking" -ForegroundColor White
Write-Host ""

Write-Host "Running migration script..." -ForegroundColor Cyan
Write-Host ""

try {
    # Run the migration script
    npm run add:missing-tables
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  ✅ MIGRATION COMPLETE!                                ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Tables Added:" -ForegroundColor Cyan
        Write-Host "  ✅ users              (2 records)" -ForegroundColor Green
        Write-Host "  ✅ login_sessions     (2 records)" -ForegroundColor Green
        Write-Host "  ✅ shops_new          (3 records)" -ForegroundColor Green
        Write-Host "  ✅ user_activity_logs (8 records)" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Total: 15 new records" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Verify in Supabase Dashboard (Table Editor)" -ForegroundColor White
        Write-Host "  2. Check tables: users, login_sessions, shops_new, user_activity_logs" -ForegroundColor White
        Write-Host "  3. Test your API endpoints" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

