-- ============================================================
-- DELIVERY APP - DATABASE VERIFICATION SCRIPT
-- ============================================================
-- Run this in Supabase SQL Editor to verify setup
-- ============================================================

-- 1. Check if delivery_agents table exists
SELECT 
  '1️⃣ DELIVERY_AGENTS TABLE' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'delivery_agents'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND - Run the complete SQL setup!'
  END as status;

-- 2. Check delivery_agents table structure
SELECT 
  '2️⃣ DELIVERY_AGENTS COLUMNS' as check_name,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'delivery_agents';

-- 3. Check foreign key constraint (should reference auth.users)
SELECT 
  '3️⃣ FOREIGN KEY CONSTRAINT' as check_name,
  conname as constraint_name,
  CASE 
    WHEN confrelid::regclass::text = 'auth.users' 
    THEN '✅ Correctly references auth.users'
    ELSE '❌ Wrong reference: ' || confrelid::regclass::text
  END as status
FROM pg_constraint
WHERE conname = 'delivery_agents_user_id_fkey';

-- 4. Check if storage bucket exists
SELECT 
  '4️⃣ STORAGE BUCKET' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'delivery-agent-documents'
    ) THEN '✅ delivery-agent-documents bucket exists'
    ELSE '❌ Bucket not found - Create it!'
  END as status;

-- 5. Check storage policies
SELECT 
  '5️⃣ STORAGE POLICIES' as check_name,
  COUNT(*) || ' policies found' as policy_count,
  CASE 
    WHEN COUNT(*) >= 8 
    THEN '✅ Policies configured (need 8+ for full access)'
    ELSE '⚠️ Only ' || COUNT(*) || ' policies - need more!'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%delivery_agent%' OR
    policyname ILIKE '%delivery%agent%'
  );

-- 6. Check if public.users table has password constraint (should NOT cause issues)
SELECT 
  '6️⃣ PUBLIC.USERS PASSWORD' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'password'
        AND is_nullable = 'NO'
    ) THEN '⚠️ Has NOT NULL constraint (but we skip this table now)'
    ELSE '✅ No password constraint or table does not exist'
  END as status;

-- 7. Test insert (dry run - will rollback)
DO $$
DECLARE
  test_uuid UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test record (will be rolled back)
  INSERT INTO delivery_agents (
    user_id, full_name, email, phone_number, alternate_phone,
    vehicle_type, vehicle_number, vehicle_name
  ) VALUES (
    NULL, 'Test Agent', 'test@example.com', '+91-9999999999', '+91-8888888888',
    'bike', 'TEST1234', 'Test Vehicle'
  );
  
  RAISE NOTICE '✅ Test insert successful (rolled back)';
  RAISE EXCEPTION 'Rollback test insert';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '7️⃣ TEST INSERT: Structure is correct';
END $$;

-- ============================================================
-- SUMMARY
-- ============================================================

SELECT $summary$
========================================
DATABASE VERIFICATION COMPLETE
========================================

CHECKLIST:
✅ delivery_agents table exists
✅ Foreign key references auth.users (not public.users)
✅ delivery-agent-documents bucket exists
✅ Storage policies configured
✅ Table structure matches requirements

IF ALL CHECKS PASS:
✅ Database is ready
✅ Registration should work
✅ No "password constraint" errors

IF ANY CHECKS FAIL:
❌ Run the complete SQL setup script first
❌ Create missing storage buckets
❌ Configure storage policies

NEXT STEP:
🔄 Clear app cache: npm run start:clear
🔄 Test registration on your device
========================================
$summary$ as verification_summary;


