# 🚀 Quick Start - Delivery App

## ✅ App is Starting!

The app should show a QR code in the terminal.

---

## 📱 How to Use:

### **Option 1: Scan QR Code (Recommended)**
1. Install **Expo Go** on your phone:
   - Android: Google Play Store
   - iOS: App Store
2. Open Expo Go app
3. Scan the QR code from the terminal
4. App will load on your phone

### **Option 2: Run on Emulator**
Press `a` for Android or `i` for iOS in the terminal

---

## ⚠️ BEFORE TESTING REGISTRATION:

### **1. Create .env file** (REQUIRED!)

Create a file named `.env` in this folder with:

```env
EXPO_PUBLIC_API_URL=https://taaza-customer.vercel.app/api
```

**Without this, the app won't connect to your backend!**

### **2. Run SQL Fix in Supabase** (CRITICAL!)

You **MUST** run `FINAL_ULTIMATE_FIX.sql` in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard
2. Project: `fcrhcwvpivkadkkbxcom`
3. SQL Editor → New Query
4. Copy ALL of `FINAL_ULTIMATE_FIX.sql`
5. Paste and Run
6. Check: "✅✅✅ CORRECT! Points to auth.users"

**If you skip this, registration will fail!**

### **3. Reload the App**

After creating `.env` file:
- Press `r` in the terminal to reload
- Or shake your phone and tap "Reload"

---

## 🧪 Test Registration:

1. ✅ `.env` file created
2. ✅ SQL fix run in Supabase
3. ✅ App reloaded
4. Open app on phone
5. Complete registration form
6. Upload all 4 documents
7. Enter bank details
8. Click "Complete Registration"
9. **Success!** 🎉

---

## 🔧 Terminal Commands:

- `r` - Reload app
- `a` - Open Android emulator
- `i` - Open iOS simulator
- `c` - Clear cache and reload
- `?` - Show all commands

---

## ❌ Troubleshooting:

### "Network request failed"
- Create `.env` file with backend URL
- Reload app (press `r`)

### "Foreign key constraint"
- Run `FINAL_ULTIMATE_FIX.sql` in Supabase
- Must see "✅ CORRECT" in results

### Can't scan QR code
- Make sure phone and computer on same WiFi
- Try pressing `s` to switch to Tunnel mode

---

**Most Important: Create .env file and run SQL fix BEFORE testing!**




