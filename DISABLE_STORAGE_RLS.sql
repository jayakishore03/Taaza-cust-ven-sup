-- ============================================================
-- DISABLE RLS ON STORAGE (QUICK FIX FOR TESTING)
-- ============================================================
-- This temporarily disables Row Level Security on storage.objects
-- so uploads will work without policy checks
-- ============================================================

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- ============================================================
-- ✅ DONE!
-- ============================================================
-- Row Level Security is now DISABLED on storage.objects
-- 
-- This means:
-- ✅ ALL uploads will work (no policy checks)
-- ✅ Anyone can upload to any bucket
-- ✅ Good for development/testing
-- ⚠️  NOT recommended for production (security risk)
-- 
-- Now test uploading in the vendor app!
-- If it works, we know the policies were the issue.
-- ============================================================

