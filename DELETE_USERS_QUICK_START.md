# 🗑️ DELETE ALL USERS - QUICK START GUIDE

## ⚠️ IMPORTANT: Read This First!

**This will PERMANENTLY DELETE all registered users from your Supabase database.**

---

## 🚀 Easiest Method: PowerShell Script (Windows)

### Step 1: Open PowerShell in Backend Directory
```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
```

### Step 2: Run the Script
```powershell
.\delete-all-users.ps1
```

### Step 3: Choose Option
```
1. View users (no deletion) ← Safe, just checks
2. Delete WITHOUT backup    ← Fast, no backup
3. Delete WITH backup       ← Safe, creates backup
4. Cancel                   ← Exit
```

### Step 4: Confirm
Type `DELETE` when prompted to confirm deletion.

**Done!** All users will be removed.

---

## 📝 Alternative: Run Script Directly

### Quick Delete (No Backup)
```powershell
cd backend
node src/scripts/delete-all-users.js --yes
```

### Safe Delete (With Backup)
```powershell
cd backend
node src/scripts/delete-all-users.js --backup --yes
```

### Just Check Users (No Delete)
```powershell
cd backend
node src/scripts/delete-all-users.js
```

---

## 🌐 Alternative: Supabase Dashboard (Manual SQL)

### Step 1: Open Supabase
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor**

### Step 2: Copy SQL
Open file: `backend/delete-all-users.sql`

Or use this SQL:
```sql
-- Delete in order
DELETE FROM login_sessions;
DELETE FROM activity_logs;
DELETE FROM order_timeline;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM addresses;
DELETE FROM user_profiles;
DELETE FROM users;

-- Verify
SELECT COUNT(*) as remaining_users FROM users;
```

### Step 3: Run
Click **Run** button. Should show `remaining_users: 0`

---

## 📊 What Gets Deleted?

| Data Type | Status |
|-----------|--------|
| Users | ❌ DELETED |
| User Profiles | ❌ DELETED |
| Addresses | ❌ DELETED |
| Orders | ❌ DELETED |
| Order Items | ❌ DELETED |
| Login Sessions | ❌ DELETED |
| Activity Logs | ❌ DELETED |
| | |
| Products | ✅ Kept |
| Shops | ✅ Kept |
| Addons | ✅ Kept |
| Coupons | ✅ Kept |
| Payment Methods | ✅ Kept |

---

## ✅ After Deletion

### What Happens:
- Database is clean
- All user data removed
- Ready for fresh registrations
- Phone numbers now available
- Existing app sessions logged out

### Test It Works:
1. Open your app
2. Go to Sign Up
3. Enter any phone number
4. Should show: "✓ This number is available"
5. Complete sign up
6. Should work perfectly ✅

---

## 💾 Backup Option

If you want to keep a backup before deleting:

```powershell
cd backend
node src/scripts/delete-all-users.js --backup --yes
```

This creates: `user-backup-[timestamp].json` with all user data.

---

## 🆘 Troubleshooting

### Problem: Script won't run
**Solution:** Make sure you're in backend directory
```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
```

### Problem: "Module not found" error
**Solution:** Install dependencies
```powershell
npm install
```

### Problem: Script shows 0 users but app has users
**Solution:** Check you're connected to correct Supabase project
- Verify `.env` file has correct `SUPABASE_URL`

---

## 📁 Files Created

1. **delete-all-users.ps1** - PowerShell menu script (easiest)
2. **src/scripts/delete-all-users.js** - Node.js script (powerful)
3. **delete-all-users.sql** - SQL script (manual)
4. **DELETE_ALL_USERS_GUIDE.md** - Detailed guide

---

## 🎯 Recommended Method

**For most users:** Use the PowerShell script
```powershell
cd backend
.\delete-all-users.ps1
```

It's:
- ✅ Interactive
- ✅ Safe (asks for confirmation)
- ✅ Easy to use
- ✅ Shows menu options

---

## ⚡ Super Quick (For Advanced Users)

One command to delete everything:
```powershell
cd backend; node src/scripts/delete-all-users.js --yes
```

---

## 🔒 Safety Tips

1. **Backup first** if data is important
2. **Double-check** you're in dev environment
3. **Verify** Supabase project in `.env`
4. **Test** app works after deletion
5. **Inform team** if working with others

---

## 📞 Questions?

### "Will this delete products/shops?"
**No.** Only user data is deleted. Products, shops, addons, etc. remain.

### "Can I undo this?"
**No.** Unless you created a backup first using `--backup` flag.

### "Will the app still work?"
**Yes.** Users just need to sign up again.

### "Do I need to redeploy anything?"
**No.** This only affects database, not code.

---

## ✅ Quick Checklist

Before running:
- [ ] I'm sure I want to delete all users
- [ ] I have backup if needed
- [ ] I'm in the backend directory
- [ ] I know this is permanent

Ready to proceed!

---

## 🚀 Run Now

Choose your method:

**Easiest:**
```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
.\delete-all-users.ps1
```

**Fast:**
```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
node src/scripts/delete-all-users.js --yes
```

**Safe:**
```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
node src/scripts/delete-all-users.js --backup --yes
```

---

**Status:** ✅ Ready to use  
**Files:** All created and ready  
**Safety:** Multiple confirmation prompts  
**Backup:** Optional but available

Good luck! 🍀

