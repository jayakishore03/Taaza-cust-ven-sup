# Delete All Users - PowerShell Wrapper
# This provides an easy way to run the delete script on Windows

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  DELETE ALL USERS FROM SUPABASE" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will PERMANENTLY delete all users!" -ForegroundColor Yellow
Write-Host ""

# Show menu
Write-Host "Choose an option:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. View users (no deletion)" -ForegroundColor Green
Write-Host "2. Delete WITHOUT backup (quick)" -ForegroundColor Yellow
Write-Host "3. Delete WITH backup (recommended)" -ForegroundColor Green
Write-Host "4. Cancel" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Viewing users..." -ForegroundColor Cyan
        node src/scripts/delete-all-users.js
    }
    "2" {
        Write-Host ""
        Write-Host "⚠️  LAST CHANCE TO CANCEL!" -ForegroundColor Red
        Write-Host "This will DELETE ALL USERS without backup." -ForegroundColor Red
        Write-Host ""
        $confirm = Read-Host "Type 'DELETE' to confirm (or anything else to cancel)"
        
        if ($confirm -eq "DELETE") {
            Write-Host ""
            Write-Host "Deleting all users..." -ForegroundColor Red
            node src/scripts/delete-all-users.js --yes
        } else {
            Write-Host ""
            Write-Host "✅ Cancelled. No users were deleted." -ForegroundColor Green
        }
    }
    "3" {
        Write-Host ""
        Write-Host "⚠️  LAST CHANCE TO CANCEL!" -ForegroundColor Red
        Write-Host "This will DELETE ALL USERS (but create a backup first)." -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Type 'DELETE' to confirm (or anything else to cancel)"
        
        if ($confirm -eq "DELETE") {
            Write-Host ""
            Write-Host "Creating backup and deleting all users..." -ForegroundColor Yellow
            node src/scripts/delete-all-users.js --backup --yes
        } else {
            Write-Host ""
            Write-Host "✅ Cancelled. No users were deleted." -ForegroundColor Green
        }
    }
    "4" {
        Write-Host ""
        Write-Host "✅ Cancelled. No users were deleted." -ForegroundColor Green
    }
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

