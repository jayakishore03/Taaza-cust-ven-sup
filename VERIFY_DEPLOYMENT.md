# ✅ Verify Backend Deployment

## Step 1: Test Backend Health Endpoint

Open your browser or use curl to test:

```bash
curl https://taaza-customer.vercel.app/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Taza API is running",
  "timestamp": "..."
}
```

If you see this, the backend is running! ✅

## Step 2: Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **taaza-customer**
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Logs** tab
6. Look for:
   - ✅ **Good**: "Supabase client initialized" or no "Missing Supabase" errors
   - ❌ **Bad**: "Missing Supabase environment variables" or "Invalid API key"

## Step 3: Test Address Saving in App

1. **Open the customer app**
2. **Sign in** (if not already signed in)
3. **Go to Profile** → **Delivery Addresses**
4. **Click "Add New Address"**
5. **Fill in the form:**
   - Contact Name: Your name
   - Phone: Your phone number
   - Street: Your street address
   - City: Your city
   - State: Your state
   - Postal Code: Your postal code
   - Landmark: (optional)
   - Label: Home/Office/Other
6. **Click "Save"**

### Expected Results:

✅ **Success:**
- Modal closes
- Alert shows: "Address saved successfully!"
- Address appears in the list
- No errors in console

❌ **If you still see errors:**

**Error: "Server configuration error"**
- Check Vercel logs (Step 2)
- Verify environment variables are set correctly
- Make sure you selected **Production**, **Preview**, and **Development** for all variables
- Try redeploying again

**Error: "Cannot connect to server"**
- Check your internet connection
- Verify API URL is correct: `https://taaza-customer.vercel.app/api`
- Check if backend is running (Step 1)

**Error: "Session expired"**
- Sign out and sign in again
- This should refresh your authentication token

## Step 4: Verify Address Saved in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Table Editor** → **addresses** table
4. You should see your newly saved address with:
   - `user_id`: Your user ID
   - `contact_name`: The name you entered
   - `street`, `city`, `state`, `postal_code`: Address details
   - `created_at`: Timestamp

## Troubleshooting

### Still seeing "Server configuration error"?

1. **Double-check environment variables in Vercel:**
   - Go to Settings → Environment Variables
   - Make sure all 3 variables are there:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Make sure they're enabled for **Production** environment

2. **Check Vercel deployment logs:**
   - Look for any errors during deployment
   - Check if environment variables were loaded

3. **Verify Supabase credentials:**
   - Go to Supabase Dashboard → Settings → API
   - Compare the values with what you set in Vercel
   - Make sure you copied the full keys (they're very long!)

4. **Try redeploying:**
   - Sometimes a redeploy is needed after adding env vars
   - Go to Deployments → ... → Redeploy

### Backend health check fails?

1. **Check Vercel deployment status:**
   - Make sure deployment completed successfully
   - Check for build errors

2. **Verify API URL:**
   - The URL should be: `https://taaza-customer.vercel.app`
   - Check if it's accessible in your browser

3. **Check CORS settings:**
   - If you see CORS errors, the backend might need CORS configuration

## Success Indicators

✅ Backend health endpoint returns success  
✅ Vercel logs show no Supabase configuration errors  
✅ Address saves successfully in the app  
✅ Address appears in Supabase database  
✅ No console errors when saving address  

If all of these are true, your deployment is successful! 🎉

