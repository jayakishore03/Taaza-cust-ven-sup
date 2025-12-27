-- ============================================
-- ADD MISSING TABLES TO SUPABASE
-- Tables: users, login_sessions, shops_new, user_activity_logs
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- ============================================
-- 2. LOGIN_SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for login_sessions
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON public.login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON public.login_sessions(token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_is_active ON public.login_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_login_sessions_expires_at ON public.login_sessions(expires_at);

-- ============================================
-- 3. SHOPS_NEW TABLE (Enhanced shops table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shops_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    distance TEXT,
    image_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    opening_time TIME,
    closing_time TIME,
    delivery_available BOOLEAN DEFAULT true,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    delivery_charge DECIMAL(10, 2) DEFAULT 40,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    owner_name TEXT,
    owner_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for shops_new
CREATE INDEX IF NOT EXISTS idx_shops_new_shop_id ON public.shops_new(shop_id);
CREATE INDEX IF NOT EXISTS idx_shops_new_is_active ON public.shops_new(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_new_latitude_longitude ON public.shops_new(latitude, longitude);

-- ============================================
-- 4. USER_ACTIVITY_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_activity_logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_metadata ON public.user_activity_logs USING GIN (metadata);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Users trigger
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_users_updated_at();

-- Login sessions trigger
CREATE OR REPLACE FUNCTION public.update_login_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_login_sessions_updated_at ON public.login_sessions;
CREATE TRIGGER trigger_update_login_sessions_updated_at
    BEFORE UPDATE ON public.login_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_login_sessions_updated_at();

-- Shops_new trigger
CREATE OR REPLACE FUNCTION public.update_shops_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shops_new_updated_at ON public.shops_new;
CREATE TRIGGER trigger_update_shops_new_updated_at
    BEFORE UPDATE ON public.shops_new
    FOR EACH ROW
    EXECUTE FUNCTION public.update_shops_new_updated_at();

-- ============================================
-- INSERT DATA
-- ============================================

-- Insert users data
INSERT INTO public.users (id, name, email, phone, password, is_active, is_verified, created_at, updated_at)
VALUES 
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3', 'Test User', 'test@example.com', '9876543210', 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', true, true, '2025-11-26T05:12:58.301Z', '2025-11-26T05:12:58.302Z'),
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a', 'Jk', 'jk@gmail.com', '6303407430', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', true, true, '2025-11-26T05:19:49.504Z', '2025-11-26T05:19:49.517Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Insert shops_new data (from existing shops)
INSERT INTO public.shops_new (shop_id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, delivery_available, created_at, updated_at)
VALUES 
  ('shop-1', 'Fresh Farm Meats', 'Benz Circle, Vijayawada, Andhra Pradesh', '0.5 km', 'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 98765 43210', 16.4997252, 80.6560636, true, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('shop-2', 'City Chicken Center', 'Patamata, Vijayawada, Andhra Pradesh - 520010', '1.2 km', 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 91234 56780', 16.494444, 80.663056, true, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('shop-3', 'Mutton & More', 'Kanaka Durga Varadhi, National Highway 65, Krishna Lanka, Vijayawada, Andhra Pradesh - 520013', '2.0 km', 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=400', '+91 99887 66554', 16.492778, 80.619167, true, true, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
ON CONFLICT (shop_id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  updated_at = NOW();

-- Insert sample login_sessions data
INSERT INTO public.login_sessions (user_id, token, device_info, ip_address, is_active, expires_at, created_at)
VALUES 
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3', 'sample_token_' || gen_random_uuid()::text, 'Android 12, Samsung Galaxy S21', '192.168.1.100', true, NOW() + INTERVAL '30 days', NOW()),
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a', 'sample_token_' || gen_random_uuid()::text, 'iOS 16, iPhone 14 Pro', '192.168.1.101', true, NOW() + INTERVAL '30 days', NOW());

-- Insert sample user_activity_logs data
INSERT INTO public.user_activity_logs (user_id, activity_type, activity_description, metadata, ip_address, created_at)
VALUES 
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3', 'LOGIN', 'User logged in successfully', '{"device": "mobile", "platform": "android"}', '192.168.1.100', NOW() - INTERVAL '1 hour'),
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3', 'VIEW_PRODUCT', 'Viewed product details', '{"product_id": "1", "product_name": "Chicken Breast"}', '192.168.1.100', NOW() - INTERVAL '45 minutes'),
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a', 'LOGIN', 'User logged in successfully', '{"device": "mobile", "platform": "ios"}', '192.168.1.101', NOW() - INTERVAL '2 hours'),
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a', 'ADD_TO_CART', 'Added item to cart', '{"product_id": "5", "quantity": 2}', '192.168.1.101', NOW() - INTERVAL '1 hour 30 minutes'),
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a', 'PLACE_ORDER', 'Placed order successfully', '{"order_id": "order-1", "total": 670}', '192.168.1.101', NOW() - INTERVAL '1 hour');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Login sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.login_sessions;
CREATE POLICY "Users can view their own sessions" ON public.login_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.login_sessions;
CREATE POLICY "Service role can manage all sessions" ON public.login_sessions
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Shops_new policies
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops_new;
CREATE POLICY "Anyone can view active shops" ON public.shops_new
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage all shops" ON public.shops_new;
CREATE POLICY "Service role can manage all shops" ON public.shops_new
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- User activity logs policies
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity_logs;
CREATE POLICY "Users can view their own activity" ON public.user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all activity logs" ON public.user_activity_logs;
CREATE POLICY "Service role can manage all activity logs" ON public.user_activity_logs
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_sessions TO authenticated;
GRANT SELECT ON public.shops_new TO authenticated;
GRANT SELECT, INSERT ON public.user_activity_logs TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.login_sessions TO service_role;
GRANT ALL ON public.shops_new TO service_role;
GRANT ALL ON public.user_activity_logs TO service_role;

-- Grant permissions for anon role
GRANT SELECT ON public.shops_new TO anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify table creation and data
-- SELECT 'users' as table_name, COUNT(*) as record_count FROM public.users
-- UNION ALL
-- SELECT 'login_sessions', COUNT(*) FROM public.login_sessions
-- UNION ALL
-- SELECT 'shops_new', COUNT(*) FROM public.shops_new
-- UNION ALL
-- SELECT 'user_activity_logs', COUNT(*) FROM public.user_activity_logs;

