# 🔍 Diagnosis: Documents Not Uploading

## Problems Found

### 1. **Images Still Failing RLS Error**
From terminal logs (line 107-123):
```
ERROR [uploadImageToStorage] Upload error: [StorageApiError: new row violates row-level security policy]
```

Even though we created the policies, the upload is STILL failing!

### 2. **Documents Skip Upload**
From logs (line 101-102):
```
LOG [createShopInSupabase] Uploading documents...
LOG [createShopInSupabase] Document upload complete!
```

This happens instantly - no actual upload attempts! The documents aren't even trying to upload.

---

## 🎯 Root Causes

### Cause 1: Supabase Client Not Using Anon Key Properly

The vendor app is probably using a **NEW Supabase session** that doesn't have the right permissions.

### Cause 2: Documents Check Failing

Looking at the code (`vendor -app/services/shops.ts` lines 600-604):
```typescript
let panDocUrl = registrationData.documents?.pan?.uri || registrationData.panDocument || null;
```

If `registrationData.documents` is undefined or doesn't have `.uri`, the documents are NULL and skip upload!

---

## ✅ Solution

### Fix 1: Check Supabase Storage Configuration

Run this SQL to verify storage is accessible:

```sql
-- Check if storage policies are working
SELECT * FROM storage.objects LIMIT 1;

-- Test insert permission
SELECT has_table_privilege('anon', 'storage.objects', 'INSERT');
```

### Fix 2: Enable RLS Bypass for Storage (Quick Fix)

**Run this SQL in Supabase to disable RLS temporarily:**

```sql
-- Disable RLS on storage.objects to test
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

This will allow ALL uploads without policy checks (good for testing).

### Fix 3: Check Document Data Structure

I need to see what `registrationData.documents` actually contains.

---

## 🚀 IMMEDIATE ACTION

### Step 1: Disable RLS on Storage (Quick Test)

1. Go to Supabase Dashboard → SQL Editor
2. Run this ONE line:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

3. Try uploading again in vendor app

If this works, then the policies are the issue. If it still fails, there's a different problem.

### Step 2: Check What Files Are in Storage

Run `CHECK_SHOP_DATA.sql` to see:
- What's in the database
- What's in storage buckets
- If any files were uploaded

---

## 🔍 Next Investigation

If disabling RLS works, we need to:
1. ✅ Verify the anon key has proper permissions
2. ✅ Check if the Supabase client is initialized correctly
3. ✅ Ensure policies target the correct role ('anon' vs 'public')

---

**Try disabling RLS first - this will tell us if it's a policy issue or something else!**

