# 🗑️ DELETE ALL USERS FROM SUPABASE

## ⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️

**This operation will PERMANENTLY DELETE all user data!**

### What Will Be Deleted:
- ❌ All registered users
- ❌ All user profiles
- ❌ All user addresses
- ❌ All orders and order history
- ❌ All login sessions
- ❌ All activity logs

### ⚠️ This Action CANNOT Be Undone!

---

## 🎯 Why You Might Want This

- Testing new signup/signin features
- Starting fresh with clean database
- Removing test accounts
- Development environment reset

---

## 📋 Options

### Option 1: Delete Without Backup (Fastest)
**Use when:** You don't need the data and want to clean quickly

### Option 2: Backup Then Delete (Safest)
**Use when:** You might want to restore data later

### Option 3: Manual SQL (Direct)
**Use when:** You want full control via Supabase dashboard

---

## 🚀 Method 1: Using the Script (Recommended)

### Step 1: Navigate to Backend
```powershell
cd backend
```

### Step 2A: Delete WITHOUT Backup (Quick)
```powershell
node src/scripts/delete-all-users.js --yes
```

**This will:**
- ✅ Show list of users to be deleted
- ✅ Delete all users and related data
- ✅ Confirm completion

### Step 2B: Delete WITH Backup (Safe)
```powershell
node src/scripts/delete-all-users.js --backup --yes
```

**This will:**
- ✅ Create backup JSON file first
- ✅ Show list of users to be deleted
- ✅ Delete all users and related data
- ✅ Backup saved as `user-backup-[timestamp].json`

---

## 🛡️ Method 2: Manual SQL in Supabase (Alternative)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: **taaza-customer** (or your project name)
3. Click **SQL Editor** in left sidebar

### Step 2: Run Deletion SQL

```sql
-- Delete in reverse order of dependencies

-- 1. Delete login sessions
DELETE FROM login_sessions;

-- 2. Delete activity logs
DELETE FROM activity_logs;

-- 3. Delete order timeline
DELETE FROM order_timeline;

-- 4. Delete order items
DELETE FROM order_items;

-- 5. Delete orders
DELETE FROM orders;

-- 6. Delete addresses
DELETE FROM addresses;

-- 7. Delete user profiles
DELETE FROM user_profiles;

-- 8. Delete users (main table)
DELETE FROM users;

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM users;
```

### Step 3: Run the Query
1. Paste the SQL above
2. Click **Run** button
3. Check results - should show `remaining_users: 0`

---

## 📊 Verification Methods

### Method A: Using Script
```powershell
cd backend
node src/scripts/delete-all-users.js
```
(Without --yes flag, it will just show count)

### Method B: Using SQL
```sql
SELECT COUNT(*) FROM users;
```
Should return: `0`

### Method C: Check Tables
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM user_profiles) as profiles,
  (SELECT COUNT(*) FROM addresses) as addresses,
  (SELECT COUNT(*) FROM orders) as orders;
```
All should return: `0`

---

## 🔄 What Happens After Deletion

### Database State:
- ✅ All user tables are empty
- ✅ Table structures remain intact
- ✅ Products, shops, addons remain (unaffected)
- ✅ Ready for fresh user registrations

### App Behavior:
- ✅ Existing logged-in users will be logged out
- ✅ Sign up works normally for new users
- ✅ Phone number validation shows all numbers as available
- ✅ Clean slate for testing

---

## 📝 Example Output

### When Running Delete Script:

```
========================================
⚠️  DELETE ALL USERS - WARNING
========================================

This will PERMANENTLY delete:
  ❌ All users
  ❌ All user profiles
  ❌ All user addresses
  ❌ All orders
  ❌ All login sessions
  ❌ All user-related activity logs

This action CANNOT be undone!
========================================

📊 Found 5 users in database:

1. John Doe (9876543210)
2. Jane Smith (9988776655)
3. Test User (8888777766)
4. Admin User (9999888877)
5. Demo Account (7777666655)

========================================
🔄 Starting deletion process...
========================================

🗑️  Deleting login sessions...
✅ Login sessions deleted
🗑️  Deleting activity logs...
✅ Activity logs deleted
🗑️  Deleting order timeline...
✅ Order timeline deleted
🗑️  Deleting order items...
✅ Order items deleted
🗑️  Deleting orders...
✅ Orders deleted
🗑️  Deleting addresses...
✅ Addresses deleted
🗑️  Deleting user profiles...
✅ User profiles deleted
🗑️  Deleting users...
✅ Users deleted

========================================
✅ DELETION COMPLETE
========================================

📊 Deleted 5 users and all related data

Database is now clean!
Users can now register fresh accounts.

========================================
```

---

## 💾 Backup File Format

If you use `--backup` flag, backup file looks like:

```json
{
  "timestamp": "2025-12-06T10:30:00.000Z",
  "users": [
    {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "password": "hashed-password",
      "created_at": "2025-12-01T00:00:00.000Z"
    }
  ],
  "profiles": [...],
  "addresses": [...]
}
```

---

## 🔧 Troubleshooting

### Problem: "Foreign key constraint" error

**Solution:** Delete in correct order (script handles this)

Or manually:
```sql
-- Disable foreign key checks (if PostgreSQL allows)
SET session_replication_role = replica;

-- Delete all
DELETE FROM login_sessions;
DELETE FROM activity_logs;
DELETE FROM order_timeline;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM addresses;
DELETE FROM user_profiles;
DELETE FROM users;

-- Re-enable
SET session_replication_role = DEFAULT;
```

---

### Problem: Script says "No users found" but app shows users

**Cause:** You might be looking at different environment

**Solution:** Check your Supabase URL in `.env`
```
SUPABASE_URL=https://your-project.supabase.co
```

---

### Problem: Users deleted but login sessions remain

**Solution:** Delete sessions separately:
```sql
DELETE FROM login_sessions;
```

---

## ⚡ Quick Commands Reference

```powershell
# View users (no deletion)
cd backend
node src/scripts/delete-all-users.js

# Delete without backup
node src/scripts/delete-all-users.js --yes

# Delete with backup
node src/scripts/delete-all-users.js --backup --yes

# Check if users exist
node -e "import('./src/scripts/delete-all-users.js')"
```

---

## 🎯 Common Use Cases

### Use Case 1: Testing New Features
```powershell
# Backup current users
node src/scripts/delete-all-users.js --backup --yes

# Test new features with fresh database
# ... test signup, signin, etc ...

# If needed, restore from backup (manual)
```

### Use Case 2: Remove Test Accounts
```powershell
# Quick clean
node src/scripts/delete-all-users.js --yes
```

### Use Case 3: Production Reset (Be Careful!)
```powershell
# Always backup first!
node src/scripts/delete-all-users.js --backup --yes

# Verify backup file exists
ls user-backup-*.json
```

---

## 🔒 Safety Checklist

Before deleting users:

- [ ] Are you sure you want to delete ALL users?
- [ ] Have you backed up important data?
- [ ] Are you in the correct environment (dev/prod)?
- [ ] Have you informed other team members?
- [ ] Do you have a way to restore if needed?

---

## ✅ After Deletion

### Test Everything Works:

1. **Test Sign Up**
   - Open app
   - Go to Sign Up
   - Enter new phone number
   - Should show: "✓ This number is available"
   - Complete sign up
   - Should succeed ✅

2. **Test Sign In**
   - Try to sign in with old credentials
   - Should show: "No account found..."
   - Expected behavior ✅

3. **Test Phone Check**
   - Go to Sign Up
   - Enter the phone you just registered
   - Should show: "⚠️ This number is already registered"
   - Feature working ✅

---

## 📞 Need Help?

If something goes wrong:

1. Check Supabase dashboard → Table Editor
2. Manually inspect tables
3. Check for error messages in console
4. Restore from backup if you created one

---

## 🚀 Ready to Delete?

### Quick Start:
```powershell
cd backend
node src/scripts/delete-all-users.js --yes
```

### Safe Start:
```powershell
cd backend
node src/scripts/delete-all-users.js --backup --yes
```

---

**⚠️ Remember: This action is PERMANENT and IRREVERSIBLE!**

Only proceed if you're absolutely sure!

