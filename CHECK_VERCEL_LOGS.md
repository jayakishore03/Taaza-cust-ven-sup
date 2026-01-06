# 🔍 How to Check Vercel Logs for 500 Error

## Step-by-Step Guide

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Find your project: **taaza-customer**
3. Click on it

### Step 2: View Deployment Logs
1. Click **"Deployments"** tab (top menu)
2. Click on the **latest deployment** (the one with the error)
3. You'll see deployment details

### Step 3: Check Function Logs
1. In the deployment page, click **"Functions"** tab
2. You'll see a list of serverless functions
3. Click on **`/api/index`** (this is your main API function)

### Step 4: View Error Logs
1. In the function details, click **"Logs"** tab
2. You'll see real-time logs and errors
3. Look for:
   - ❌ Red error messages
   - Stack traces
   - "Error loading Express app" messages
   - Import errors
   - Module not found errors

### Step 5: Check Build Logs (Alternative)
1. In the deployment page, click **"Build Logs"** tab
2. Look for:
   - Build errors
   - Missing dependencies
   - Syntax errors

---

## Common Error Messages to Look For

### 1. Import/Module Errors
```
Error: Cannot find module './routes/xxx'
Error: Failed to load module
```
**Solution**: Check if all route files exist

### 2. Syntax Errors
```
SyntaxError: Unexpected token
```
**Solution**: Check for syntax errors in route files

### 3. Database Connection Errors
```
Error: connect ECONNREFUSED
Error: Invalid connection string
```
**Solution**: Check Supabase credentials (but yours are set ✅)

### 4. Missing Directory Errors
```
Error: ENOENT: no such file or directory
```
**Solution**: Missing images directory (we fixed this)

---

## What to Share

When you find the error, share:
1. The **exact error message**
2. The **stack trace** (if available)
3. Which **endpoint** was called when it failed

This will help identify the exact issue!

---

## Quick Test

While checking logs, also test these endpoints:

1. **Test Endpoint** (should work):
   ```
   https://taaza-customer.vercel.app/api/test
   ```

2. **Health Endpoint** (should work):
   ```
   https://taaza-customer.vercel.app/health
   ```

3. **API Root** (might fail):
   ```
   https://taaza-customer.vercel.app/api
   ```

4. **Products** (might fail):
   ```
   https://taaza-customer.vercel.app/api/products
   ```

**Which ones work?** This tells us where the problem starts.

