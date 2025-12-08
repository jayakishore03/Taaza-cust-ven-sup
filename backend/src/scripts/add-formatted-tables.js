/**
 * Add Properly Formatted Tables to Supabase
 * Tables: users, login_sessions, shops_new, user_activity_logs
 * With proper data types and constraints
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : process.env.DIRECT_URL,
  ssl: isProduction ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
});

function loadJSON(filename) {
  const filePath = join(__dirname, '../../data', filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function createTables(client) {
  console.log('\n📝 Creating properly formatted tables...\n');

  // 1. Users table
  await client.query(`
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
    
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
  `);
  console.log('  ✅ users table created');

  // 2. Login sessions table
  await client.query(`
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
    
    CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(is_active, expires_at) WHERE is_active = true;
  `);
  console.log('  ✅ login_sessions table created');

  // 3. Shops_new table
  await client.query(`
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
        
        CONSTRAINT shops_new_name_check CHECK (LENGTH(TRIM(name)) > 0)
    );
    
    CREATE INDEX IF NOT EXISTS idx_shops_new_shop_id ON shops_new(shop_id);
    CREATE INDEX IF NOT EXISTS idx_shops_new_active ON shops_new(is_active) WHERE is_active = true;
    CREATE INDEX IF NOT EXISTS idx_shops_new_location ON shops_new(latitude, longitude) WHERE latitude IS NOT NULL;
  `);
  console.log('  ✅ shops_new table created');

  // 4. User activity logs table
  await client.query(`
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
    
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type);
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_activity_logs_metadata ON user_activity_logs USING GIN (metadata);
  `);
  console.log('  ✅ user_activity_logs table created');

  // Create triggers
  await client.query(`
    CREATE OR REPLACE FUNCTION update_users_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
    CREATE TRIGGER trigger_update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_users_updated_at();

    CREATE OR REPLACE FUNCTION update_login_sessions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.last_activity_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_update_login_sessions_updated_at ON login_sessions;
    CREATE TRIGGER trigger_update_login_sessions_updated_at
        BEFORE UPDATE ON login_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_login_sessions_updated_at();

    CREATE OR REPLACE FUNCTION update_shops_new_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_update_shops_new_updated_at ON shops_new;
    CREATE TRIGGER trigger_update_shops_new_updated_at
        BEFORE UPDATE ON shops_new
        FOR EACH ROW
        EXECUTE FUNCTION update_shops_new_updated_at();
  `);
  console.log('  ✅ Triggers created\n');
}

async function insertData(client) {
  console.log('📦 Loading data...\n');

  // Insert users
  const users = loadJSON('users.json');
  for (const user of users) {
    await client.query(`
      INSERT INTO users (id, name, email, phone, password, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = NOW()
    `, [user.id, user.name, user.email, user.phone, user.password, 
        user.is_active !== false, user.is_verified !== false, 
        user.created_at, user.updated_at]);
  }
  console.log(`  ✅ Loaded ${users.length} users`);

  // Insert shops_new
  const shops = loadJSON('shops.json');
  for (const shop of shops) {
    await client.query(`
      INSERT INTO shops_new (shop_id, name, address, distance, image_url, contact_phone, 
        latitude, longitude, is_active, delivery_available, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (shop_id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        updated_at = NOW()
    `, [shop.id, shop.name, shop.address, shop.distance, shop.image_url, 
        shop.contact_phone, shop.latitude, shop.longitude, 
        shop.is_active !== false, true, shop.created_at, shop.updated_at]);
  }
  console.log(`  ✅ Loaded ${shops.length} shops`);

  // Insert login sessions
  const userIds = users.map(u => u.id);
  for (const userId of userIds) {
    // Generate a longer token (minimum 21 characters)
    const token = `session_token_${Math.random().toString(36).substring(2)}_${Math.random().toString(36).substring(2)}`;
    await client.query(`
      INSERT INTO login_sessions (user_id, token, device_info, ip_address, is_active, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId,
      token,
      JSON.stringify({ device: 'Mobile', os: 'Android' }),
      '192.168.1.100',
      true,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ]);
  }
  console.log(`  ✅ Loaded ${userIds.length} login sessions`);

  // Insert activity logs
  const activities = [
    { type: 'LOGIN', desc: 'User logged in', meta: { device: 'mobile' } },
    { type: 'VIEW_PRODUCT', desc: 'Viewed product', meta: { product_id: '1' } },
    { type: 'ADD_TO_CART', desc: 'Added to cart', meta: { quantity: 2 } },
    { type: 'PLACE_ORDER', desc: 'Placed order', meta: { total: 670 } },
  ];

  for (const userId of userIds) {
    for (const activity of activities) {
      await client.query(`
        INSERT INTO user_activity_logs (user_id, activity_type, activity_description, metadata, ip_address, device_info)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        activity.type,
        activity.desc,
        JSON.stringify(activity.meta),
        '192.168.1.100',
        JSON.stringify({ device: 'Mobile' })
      ]);
    }
  }
  console.log(`  ✅ Loaded ${userIds.length * activities.length} activity logs\n`);
}

async function enableRLS(client) {
  console.log('🔐 Enabling Row Level Security...\n');

  await client.query(`
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE shops_new ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "users_select_own" ON users;
    CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "users_service_all" ON users;
    CREATE POLICY "users_service_all" ON users FOR ALL USING (auth.jwt()->>'role' = 'service_role');

    DROP POLICY IF EXISTS "sessions_select_own" ON login_sessions;
    CREATE POLICY "sessions_select_own" ON login_sessions FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "sessions_service_all" ON login_sessions;
    CREATE POLICY "sessions_service_all" ON login_sessions FOR ALL USING (auth.jwt()->>'role' = 'service_role');

    DROP POLICY IF EXISTS "shops_select_active" ON shops_new;
    CREATE POLICY "shops_select_active" ON shops_new FOR SELECT USING (is_active = true);
    
    DROP POLICY IF EXISTS "shops_service_all" ON shops_new;
    CREATE POLICY "shops_service_all" ON shops_new FOR ALL USING (auth.jwt()->>'role' = 'service_role');

    DROP POLICY IF EXISTS "activity_select_own" ON user_activity_logs;
    CREATE POLICY "activity_select_own" ON user_activity_logs FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "activity_service_all" ON user_activity_logs;
    CREATE POLICY "activity_service_all" ON user_activity_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
  `);
  console.log('  ✅ RLS enabled and policies created\n');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ADD PROPERLY FORMATTED TABLES TO SUPABASE             ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  let client;
  
  try {
    console.log('\n🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected\n');

    await createTables(client);
    await insertData(client);
    await enableRLS(client);

    // Verify
    const result = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name AND table_schema = 'public') as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'login_sessions', 'shops_new', 'user_activity_logs')
      ORDER BY table_name
    `);

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRATION COMPLETE!                                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('Tables Created:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name.padEnd(20)} (${row.columns} columns)`);
    });

    // Count records
    const counts = await client.query(`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'login_sessions', COUNT(*) FROM login_sessions
      UNION ALL
      SELECT 'shops_new', COUNT(*) FROM shops_new
      UNION ALL
      SELECT 'user_activity_logs', COUNT(*) FROM user_activity_logs
    `);

    console.log('\nData Loaded:');
    counts.rows.forEach(row => {
      console.log(`  📊 ${row.table_name.padEnd(20)} ${row.count} records`);
    });

    console.log('\n🎉 All tables added successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main().catch(console.error);

