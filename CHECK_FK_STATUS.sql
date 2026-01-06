-- ============================================================
-- QUICK CHECK: What is the delivery_agents foreign key pointing to?
-- ============================================================
-- Run this FIRST to see what the current constraint is pointing to
-- ============================================================

SELECT 
  '🔍 CURRENT FOREIGN KEY STATUS' as check_type,
  c.conname as constraint_name,
  t.relname as table_name,
  n.nspname as table_schema,
  rt.relname as referenced_table,
  rn.nspname as referenced_schema,
  CASE 
    WHEN rn.nspname = 'auth' AND rt.relname = 'users' THEN '✅ CORRECT - Points to auth.users'
    WHEN rn.nspname = 'public' AND rt.relname = 'users' THEN '❌ WRONG - Points to public.users (NEEDS FIX!)'
    ELSE '⚠️ UNKNOWN - Points to ' || rn.nspname || '.' || rt.relname
  END as status
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
JOIN pg_class rt ON c.confrelid = rt.oid
JOIN pg_namespace rn ON rt.relnamespace = rn.oid
WHERE t.relname = 'delivery_agents'
  AND n.nspname = 'public'
  AND c.contype = 'f'
  AND EXISTS (
    SELECT 1 
    FROM pg_attribute a
    WHERE a.attrelid = c.conrelid
    AND a.attnum = ANY(c.conkey)
    AND a.attname = 'user_id'
  );

-- If no results, the constraint doesn't exist yet
-- If you see "❌ WRONG", run IMMEDIATE_FK_FIX.sql
