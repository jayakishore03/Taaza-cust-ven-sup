# Backend Environment Setup

## Create .env File

Create a file named `.env` in the `backend` folder with this content:

```env
# Supabase Configuration
SUPABASE_URL=https://fcrhcwvpivkadkkbxcom.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*
```

## Get Service Role Key

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `fcrhcwvpivkadkkbxcom`
3. Click **Settings** (gear icon) → **API**
4. Scroll to **Project API keys**
5. Copy the **service_role** key (secret - keep it safe!)
6. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in the .env file

## After Creating .env

Restart the backend:
```bash
npm start
```

Should see:
```
✅ Backend running on port 3000
```

