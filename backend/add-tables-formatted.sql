-- ============================================
-- PROPERLY FORMATTED TABLES FOR SUPABASE
-- Tables: users, login_sessions, shops_new, user_activity_logs
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT users_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT users_phone_check CHECK (LENGTH(TRIM(phone)) >= 10)
);

COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.name IS 'Full name of the user';
COMMENT ON COLUMN users.email IS 'Email address (optional, unique)';
COMMENT ON COLUMN users.phone IS 'Phone number (required, unique, min 10 digits)';
COMMENT ON COLUMN users.password IS 'Hashed password (SHA-256)';
COMMENT ON COLUMN users.is_active IS 'Account status (active/inactive)';
COMMENT ON COLUMN users.is_verified IS 'Phone/email verification status';

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ============================================
-- 2. LOGIN_SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info JSONB DEFAULT '{}'::JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT login_sessions_token_check CHECK (LENGTH(token) > 20),
    CONSTRAINT login_sessions_expiry_check CHECK (expires_at > created_at)
);

COMMENT ON TABLE login_sessions IS 'User login sessions and authentication tokens';
COMMENT ON COLUMN login_sessions.user_id IS 'Reference to users table';
COMMENT ON COLUMN login_sessions.token IS 'Authentication token (JWT or session ID)';
COMMENT ON COLUMN login_sessions.device_info IS 'Device information in JSON format';
COMMENT ON COLUMN login_sessions.ip_address IS 'IP address of the session';
COMMENT ON COLUMN login_sessions.expires_at IS 'Token expiration timestamp';

CREATE INDEX idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX idx_login_sessions_token ON login_sessions(token);
CREATE INDEX idx_login_sessions_active ON login_sessions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_login_sessions_expires_at ON login_sessions(expires_at) WHERE is_active = true;

-- ============================================
-- 3. SHOPS_NEW TABLE (Enhanced shops table)
-- ============================================
CREATE TABLE IF NOT EXISTS shops_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    distance VARCHAR(50),
    image_url TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    is_active BOOLEAN DEFAULT true,
    opening_time TIME DEFAULT '09:00:00',
    closing_time TIME DEFAULT '21:00:00',
    delivery_available BOOLEAN DEFAULT true,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    delivery_charge NUMERIC(10, 2) DEFAULT 40,
    avg_rating NUMERIC(3, 2) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    owner_name VARCHAR(255),
    owner_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT shops_new_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT shops_new_coordinates_check CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL AND 
         latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

COMMENT ON TABLE shops_new IS 'Shop information with enhanced features';
COMMENT ON COLUMN shops_new.shop_id IS 'Unique shop identifier (string)';
COMMENT ON COLUMN shops_new.latitude IS 'GPS latitude (-90 to 90)';
COMMENT ON COLUMN shops_new.longitude IS 'GPS longitude (-180 to 180)';
COMMENT ON COLUMN shops_new.avg_rating IS 'Average customer rating (0-5)';

CREATE INDEX idx_shops_new_shop_id ON shops_new(shop_id);
CREATE INDEX idx_shops_new_active ON shops_new(is_active) WHERE is_active = true;
CREATE INDEX idx_shops_new_location ON shops_new(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_shops_new_rating ON shops_new(avg_rating DESC) WHERE is_active = true;

-- ============================================
-- 4. USER_ACTIVITY_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT user_activity_logs_type_check CHECK (LENGTH(TRIM(activity_type)) > 0)
);

COMMENT ON TABLE user_activity_logs IS 'Track user activities and actions';
COMMENT ON COLUMN user_activity_logs.activity_type IS 'Type of activity (LOGIN, VIEW_PRODUCT, etc.)';
COMMENT ON COLUMN user_activity_logs.metadata IS 'Additional activity data in JSON format';

CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_user_created ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_user_activity_logs_metadata ON user_activity_logs USING GIN (metadata);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================

-- Users updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Login sessions updated_at trigger
CREATE OR REPLACE FUNCTION update_login_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_login_sessions_updated_at
    BEFORE UPDATE ON login_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_login_sessions_updated_at();

-- Shops_new updated_at trigger
CREATE OR REPLACE FUNCTION update_shops_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shops_new_updated_at
    BEFORE UPDATE ON shops_new
    FOR EACH ROW
    EXECUTE FUNCTION update_shops_new_updated_at();

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert users
INSERT INTO users (id, name, email, phone, password, is_active, is_verified, created_at, updated_at)
VALUES 
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3'::UUID, 
   'Test User', 
   'test@example.com', 
   '9876543210', 
   'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', 
   true, 
   true, 
   '2025-11-26T05:12:58.301Z'::TIMESTAMPTZ, 
   '2025-11-26T05:12:58.302Z'::TIMESTAMPTZ),
  
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a'::UUID, 
   'Jk', 
   'jk@gmail.com', 
   '6303407430', 
   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 
   true, 
   true, 
   '2025-11-26T05:19:49.504Z'::TIMESTAMPTZ, 
   '2025-11-26T05:19:49.517Z'::TIMESTAMPTZ)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Insert shops_new
INSERT INTO shops_new (shop_id, name, address, distance, image_url, contact_phone, latitude, longitude, is_active, delivery_available, created_at, updated_at)
VALUES 
  ('shop-1', 
   'Fresh Farm Meats', 
   'Benz Circle, Vijayawada, Andhra Pradesh', 
   '0.5 km', 
   'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400', 
   '+91 98765 43210', 
   16.4997252, 
   80.6560636, 
   true, 
   true, 
   '2024-01-01T00:00:00.000Z'::TIMESTAMPTZ, 
   '2024-01-01T00:00:00.000Z'::TIMESTAMPTZ),
  
  ('shop-2', 
   'City Chicken Center', 
   'Patamata, Vijayawada, Andhra Pradesh - 520010', 
   '1.2 km', 
   'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=400', 
   '+91 91234 56780', 
   16.494444, 
   80.663056, 
   true, 
   true, 
   '2024-01-01T00:00:00.000Z'::TIMESTAMPTZ, 
   '2024-01-01T00:00:00.000Z'::TIMESTAMPTZ),
  
  ('shop-3', 
   'Mutton & More', 
   'Kanaka Durga Varadhi, National Highway 65, Krishna Lanka, Vijayawada, Andhra Pradesh - 520013', 
   '2.0 km', 
   'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=400', 
   '+91 99887 66554', 
   16.492778, 
   80.619167, 
   true, 
   true, 
   '2024-01-01T00:00:00.000Z'::TIMESTAMPTZ, 
   '2024-01-01T00:00:00.000Z'::TIMESTAMPTZ)
ON CONFLICT (shop_id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  updated_at = NOW();

-- Insert login sessions
INSERT INTO login_sessions (user_id, token, device_info, ip_address, is_active, expires_at, created_at)
VALUES 
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3'::UUID,
   'session_token_' || gen_random_uuid()::TEXT,
   '{"device": "Android", "model": "Samsung Galaxy S21", "os": "Android 12"}'::JSONB,
   '192.168.1.100'::INET,
   true,
   (NOW() + INTERVAL '30 days')::TIMESTAMPTZ,
   NOW()),
  
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a'::UUID,
   'session_token_' || gen_random_uuid()::TEXT,
   '{"device": "iPhone", "model": "iPhone 14 Pro", "os": "iOS 16"}'::JSONB,
   '192.168.1.101'::INET,
   true,
   (NOW() + INTERVAL '30 days')::TIMESTAMPTZ,
   NOW());

-- Insert user activity logs
INSERT INTO user_activity_logs (user_id, activity_type, activity_description, metadata, ip_address, device_info, created_at)
VALUES 
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3'::UUID,
   'LOGIN',
   'User logged in successfully',
   '{"device": "mobile", "platform": "android", "app_version": "1.0.0"}'::JSONB,
   '192.168.1.100'::INET,
   '{"device": "Android", "model": "Samsung Galaxy S21"}'::JSONB,
   NOW() - INTERVAL '1 hour'),
  
  ('df5af33f-cf91-48f6-9eb4-64ea820b78c3'::UUID,
   'VIEW_PRODUCT',
   'Viewed product details',
   '{"product_id": "1", "product_name": "Chicken Breast Boneless", "category": "Chicken"}'::JSONB,
   '192.168.1.100'::INET,
   '{"device": "Android", "model": "Samsung Galaxy S21"}'::JSONB,
   NOW() - INTERVAL '45 minutes'),
  
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a'::UUID,
   'LOGIN',
   'User logged in successfully',
   '{"device": "mobile", "platform": "ios", "app_version": "1.0.0"}'::JSONB,
   '192.168.1.101'::INET,
   '{"device": "iPhone", "model": "iPhone 14 Pro"}'::JSONB,
   NOW() - INTERVAL '2 hours'),
  
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a'::UUID,
   'ADD_TO_CART',
   'Added item to cart',
   '{"product_id": "5", "product_name": "Mutton Curry Cut", "quantity": 2, "weight": "1kg"}'::JSONB,
   '192.168.1.101'::INET,
   '{"device": "iPhone", "model": "iPhone 14 Pro"}'::JSONB,
   NOW() - INTERVAL '1 hour 30 minutes'),
  
  ('363b1210-bc12-43ad-b0e4-1664dd1dcf3a'::UUID,
   'PLACE_ORDER',
   'Placed order successfully',
   '{"order_id": "order-1", "total": 670, "items_count": 2, "payment_method": "COD"}'::JSONB,
   '192.168.1.101'::INET,
   '{"device": "iPhone", "model": "iPhone 14 Pro"}'::JSONB,
   NOW() - INTERVAL '1 hour');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_service_all" ON users FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Login sessions policies
CREATE POLICY "sessions_select_own" ON login_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON login_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "sessions_service_all" ON login_sessions FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Shops_new policies
CREATE POLICY "shops_select_active" ON shops_new FOR SELECT USING (is_active = true);
CREATE POLICY "shops_service_all" ON shops_new FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- User activity logs policies
CREATE POLICY "activity_select_own" ON user_activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_insert_own" ON user_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_service_all" ON user_activity_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON login_sessions TO authenticated;
GRANT SELECT ON shops_new TO authenticated;
GRANT SELECT, INSERT ON user_activity_logs TO authenticated;

GRANT ALL ON users TO service_role;
GRANT ALL ON login_sessions TO service_role;
GRANT ALL ON shops_new TO service_role;
GRANT ALL ON user_activity_logs TO service_role;

GRANT SELECT ON shops_new TO anon;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Migration complete! All tables created with proper formatting.' as status;

-- Check tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('users', 'login_sessions', 'shops_new', 'user_activity_logs')
ORDER BY table_name;

