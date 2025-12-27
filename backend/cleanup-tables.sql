-- ============================================
-- CLEANUP SCRIPT - Remove Newly Added Tables
-- This will drop: users, login_sessions, shops_new, user_activity_logs
-- ============================================

-- Drop tables in correct order (due to foreign key constraints)
-- Drop dependent tables first, then parent tables

DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP TABLE IF EXISTS public.login_sessions CASCADE;
DROP TABLE IF EXISTS public.shops_new CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop any remaining triggers
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS trigger_update_login_sessions_updated_at ON public.login_sessions;
DROP TRIGGER IF EXISTS trigger_update_shops_new_updated_at ON public.shops_new;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS public.update_users_updated_at();
DROP FUNCTION IF EXISTS public.update_login_sessions_updated_at();
DROP FUNCTION IF EXISTS public.update_shops_new_updated_at();

-- Verification: Check that tables are gone
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('users', 'login_sessions', 'shops_new', 'user_activity_logs');
-- Should return 0 rows

SELECT '✅ Cleanup complete! Tables removed.' as status;

