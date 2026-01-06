# Add Environment Variables to Vercel Backend Project
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  ADD VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Set the environment variables
$SUPABASE_URL = "https://fcrhcwvpivkadkkbxcom.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg"
$SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo"

Write-Host "Adding environment variables to Vercel..." -ForegroundColor Yellow
Write-Host ""

# Add SUPABASE_URL
Write-Host "1. Adding SUPABASE_URL..." -ForegroundColor Cyan
echo $SUPABASE_URL | vercel env add SUPABASE_URL production --yes

# Add SUPABASE_ANON_KEY
Write-Host "2. Adding SUPABASE_ANON_KEY..." -ForegroundColor Cyan
echo $SUPABASE_ANON_KEY | vercel env add SUPABASE_ANON_KEY production --yes

# Add SUPABASE_SERVICE_ROLE_KEY  
Write-Host "3. Adding SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Cyan
echo $SUPABASE_SERVICE_ROLE_KEY | vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes

# Add NODE_ENV
Write-Host "4. Adding NODE_ENV..." -ForegroundColor Cyan
echo "production" | vercel env add NODE_ENV production --yes

Write-Host ""
Write-Host "✅ Environment variables added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Now redeploying..." -ForegroundColor Yellow

# Redeploy
vercel --prod --yes

Write-Host ""
Write-Host "✅ DONE! Backend deployed with environment variables!" -ForegroundColor Green
Write-Host ""

