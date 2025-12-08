# 💳 Payment Setup - Complete Guide

## 🎯 Current Status

Your Razorpay credentials are ready to be added!

**Test Credentials:**
- Key ID: `rzp_test_RkgC2RZSP1gZNW`
- Key Secret: `ivWo5qTwct9dCsKlCG43NhCS`

---

## ⚡ Quick Fix (2 Options)

### **Option 1: Test COD Now** (Works Immediately! ✅)

Cash on Delivery doesn't need any setup:

```
1. Open app
2. Add items to cart
3. Go to checkout
4. Fill address
5. Click "Place Order"
6. Select "Cash on Delivery"
7. Click "Place Order"
8. ✅ Order placed!
```

**No setup required!** COD works right now.

---

### **Option 2: Enable Online Payments** (5 minutes setup)

To enable UPI and Card payments:

#### **🔥 CRITICAL: Add to Vercel**

Your app uses the backend deployed on Vercel, so you **MUST** add credentials there:

```
Step 1: Open Vercel
   👉 https://vercel.com
   👉 Sign in
   👉 Open your backend project

Step 2: Add Environment Variables
   👉 Settings → Environment Variables
   👉 Click "Add New"

Step 3: Add RAZORPAY_KEY_ID
   Name:  RAZORPAY_KEY_ID
   Value: rzp_test_RkgC2RZSP1gZNW
   ✅ Check: Production, Preview, Development
   👉 Click "Save"

Step 4: Add RAZORPAY_KEY_SECRET
   Name:  RAZORPAY_KEY_SECRET
   Value: ivWo5qTwct9dCsKlCG43NhCS
   ✅ Check: Production, Preview, Development
   👉 Click "Save"

Step 5: Redeploy
   👉 Go to "Deployments" tab
   👉 Click latest deployment
   👉 Click "Redeploy"
   👉 Wait 2 minutes ⏱️

Step 6: Test
   👉 Open app
   👉 Try UPI/Card payment
   👉 ✅ Should work!
```

---

## 📋 Detailed Steps with Screenshots

### **Finding Vercel Environment Variables:**

1. **Login to Vercel**
   ```
   https://vercel.com
   ```

2. **Select Your Project**
   ```
   Dashboard
     └── Your Projects
           └── [Your Backend Project]  ← Click here
   ```

3. **Open Settings**
   ```
   Project Page
     └── Settings (top menu)  ← Click here
   ```

4. **Environment Variables**
   ```
   Settings Page
     └── Environment Variables (left sidebar)  ← Click here
   ```

5. **Add Variable**
   ```
   Click "Add New" button
   
   ┌─────────────────────────────────┐
   │ Key:                            │
   │ ┌─────────────────────────────┐ │
   │ │ RAZORPAY_KEY_ID             │ │
   │ └─────────────────────────────┘ │
   │                                 │
   │ Value:                          │
   │ ┌─────────────────────────────┐ │
   │ │ rzp_test_RkgC2RZSP1gZNW     │ │
   │ └─────────────────────────────┘ │
   │                                 │
   │ Environments:                   │
   │ ☑ Production                    │
   │ ☑ Preview                       │
   │ ☑ Development                   │
   │                                 │
   │ [Save]                          │
   └─────────────────────────────────┘
   ```

6. **Repeat for Secret**
   - Click "Add New" again
   - Name: `RAZORPAY_KEY_SECRET`
   - Value: `ivWo5qTwct9dCsKlCG43NhCS`
   - Check all 3 environments
   - Click "Save"

7. **Redeploy**
   ```
   Go to: Deployments tab
   Click: Latest deployment
   Click: "Redeploy" button
   Wait: 2 minutes
   ```

---

## ✅ Verification Checklist

### **After Adding to Vercel:**

- [ ] Both environment variables show in Vercel
  - [ ] `RAZORPAY_KEY_ID`
  - [ ] `RAZORPAY_KEY_SECRET`
- [ ] All 3 environments selected for each
- [ ] Clicked "Save" for each variable
- [ ] Redeployed the project
- [ ] Waited 2-3 minutes

### **Testing:**

- [ ] Opened app
- [ ] Added items to cart
- [ ] Went to checkout
- [ ] Filled address
- [ ] Clicked "Place Order"
- [ ] Selected payment method:
  - [ ] **COD** - Should work now
  - [ ] **UPI** - Should work after Vercel setup
  - [ ] **Card** - Should work after Vercel setup

---

## 🧪 Test Cards (After Vercel Setup)

### **Successful Payment:**
```
Card Number: 4111 1111 1111 1111
Expiry Date: 12/25 (or any future date)
CVV: 123
Name: Test User
```

### **Failed Payment (for testing):**
```
Card Number: 4000 0000 0000 0002
Expiry Date: 12/25
CVV: 123
```

### **UPI Test:**
```
UPI ID: success@razorpay
```

---

## 🚨 Troubleshooting

### **Error: "Razorpay credentials not configured"**

**Cause:** Environment variables not added to Vercel  
**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
3. Redeploy
4. Wait 2 minutes
5. Try again

---

### **Error: "Invalid key_id"**

**Cause:** Wrong Key ID value  
**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Click on `RAZORPAY_KEY_ID`
3. Edit value to exactly: `rzp_test_RkgC2RZSP1gZNW`
4. Save
5. Redeploy

---

### **Payment modal doesn't open**

**Cause:** Deployment not updated  
**Solution:**
1. Go to Vercel → Deployments
2. Click latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes
5. Force quit and reopen app
6. Try again

---

### **COD works but UPI/Card doesn't**

**Cause:** Razorpay not configured on Vercel  
**Solution:**
- COD doesn't need Razorpay
- UPI/Card need Vercel environment variables
- Follow "Option 2" steps above

---

## 📊 Payment Flow Overview

```
┌─────────────────────────────────────────┐
│         User Places Order               │
└─────────────────┬───────────────────────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
    ┌──────────┐    ┌─────────────┐
    │   COD    │    │ UPI / Card  │
    └────┬─────┘    └──────┬──────┘
         │                 │
         │          ┌──────▼──────┐
         │          │  Razorpay   │
         │          │  Checkout   │
         │          └──────┬──────┘
         │                 │
         │          ┌──────▼──────┐
         │          │   Payment   │
         │          │  Verified   │
         │          └──────┬──────┘
         │                 │
         └────────┬────────┘
                  │
          ┌───────▼────────┐
          │  Create Order  │
          │   in Backend   │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │ Order Success  │
          └────────────────┘
```

---

## 🎯 Summary

### **For Immediate Testing:**
✅ Use **Cash on Delivery** - works now, no setup

### **For Full Payment Features:**
1. ✅ Add Razorpay credentials to **Vercel**
2. ✅ Redeploy on Vercel
3. ✅ Wait 2 minutes
4. ✅ Test all payment methods

---

## 📁 Additional Resources

- **Vercel Setup:** `backend/ADD_RAZORPAY_TO_VERCEL.md`
- **Quick Guide:** `RAZORPAY_QUICK_SETUP.md`
- **Local Setup:** Run `backend\setup-razorpay.ps1`
- **Test Config:** Run `backend\test-razorpay.ps1`

---

## 🎉 Expected Result

After Vercel setup:
- ✅ COD payment works
- ✅ UPI payment works
- ✅ Card payment works
- ✅ Razorpay checkout modal opens
- ✅ Test payments go through
- ✅ Orders are created successfully

---

**Add credentials to Vercel and all payment methods will work!** 🚀

