# ⚡ Razorpay Quick Setup Guide

## 🎯 Fix Payment Error in 5 Minutes

You're seeing this error:
```
Error: Razorpay credentials not configured
```

**Solution:** Add Razorpay credentials to Vercel

---

## 🚀 Fastest Fix (Choose One)

### **Option 1: Use Cash on Delivery (Works Now!)** ✅

COD doesn't need Razorpay setup:

1. Add items to cart
2. Go to checkout
3. Fill address
4. Click "Place Order"
5. Select **"Cash on Delivery"**
6. Click "Place Order"
7. ✅ **Works immediately!**

---

### **Option 2: Enable Online Payments** 💳

To enable UPI/Card payments, add Razorpay to Vercel:

#### **⚡ 2-Minute Steps:**

1. **Go to Vercel:**
   - https://vercel.com
   - Sign in
   - Open your backend project

2. **Add Environment Variables:**
   - Click **Settings** → **Environment Variables**
   - Add these TWO variables:

   ```
   Name:  RAZORPAY_KEY_ID
   Value: rzp_test_RkgC2RZSP1gZNW
   ```

   ```
   Name:  RAZORPAY_KEY_SECRET
   Value: ivWo5qTwct9dCsKlCG43NhCS
   ```

3. **Select All Environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Click "Save"** for each

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click latest deployment
   - Click **"Redeploy"**
   - Wait 2 minutes

6. **Test in App:**
   - Select UPI/Card payment
   - Click "Pay Securely"
   - ✅ Should work!

---

## 📋 Your Credentials

**Test Key ID:**
```
rzp_test_RkgC2RZSP1gZNW
```

**Test Key Secret:**
```
ivWo5qTwct9dCsKlCG43NhCS
```

---

## ✅ Verification

### **Payment Works When:**
- ✅ No "credentials not configured" error
- ✅ Razorpay modal opens when you click "Pay"
- ✅ You can enter test card details

### **Test Cards (After Setup):**

**Success:**
- Card: `4111 1111 1111 1111`
- Expiry: `12/25`
- CVV: `123`

**UPI:**
- UPI ID: `success@razorpay`

---

## 🎯 Quick Checklist

**For COD (Works Now):**
- [ ] Select "Cash on Delivery"
- [ ] Order placed successfully

**For Online Payment (Requires Setup):**
- [ ] Added `RAZORPAY_KEY_ID` to Vercel
- [ ] Added `RAZORPAY_KEY_SECRET` to Vercel
- [ ] Redeployed on Vercel
- [ ] Waited 2 minutes
- [ ] Tested UPI/Card payment

---

## 📁 Detailed Guides

For step-by-step instructions with screenshots:

- **Vercel Setup:** See `backend/ADD_RAZORPAY_TO_VERCEL.md`
- **Local Testing:** Run `backend/setup-razorpay.ps1`

---

## 🚨 Common Issues

### **"Razorpay credentials not configured"**
✅ **Fix:** Add environment variables to Vercel (see Option 2 above)

### **"Invalid key_id"**
✅ **Fix:** Double-check the Key ID is exactly: `rzp_test_RkgC2RZSP1gZNW`

### **Payment modal doesn't open**
✅ **Fix:** 
1. Check environment variables are saved
2. Redeploy on Vercel
3. Wait 2 minutes
4. Try again

---

## 💡 Recommendation

### **For Testing Right Now:**
👉 **Use Cash on Delivery** (works immediately, no setup)

### **For Production/Live App:**
👉 **Setup Razorpay on Vercel** (takes 5 minutes, enables all payment methods)

---

## 🎉 Result

After setup:
- ✅ COD works
- ✅ UPI works
- ✅ Card works
- ✅ All payment methods functional

---

**Choose your option and start taking orders!** 🚀

