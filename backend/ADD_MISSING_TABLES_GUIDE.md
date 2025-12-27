# ✅ Add Missing Tables to Supabase

## 📋 Missing Tables

These tables are missing from your Supabase database:
1. **users** - User accounts
2. **login_sessions** - User login sessions and tokens
3. **shops_new** - Enhanced shops table with additional fields
4. **user_activity_logs** - Track user activities and actions

---

## 🚀 Quick Start - Choose One Method

### **Method 1: Automated Script (Recommended) ⭐**

Run this command from the `backend` directory:

```bash
cd backend
npm run add:missing-tables
```

This will:
- ✅ Create all 4 missing tables
- ✅ Add indexes for performance
- ✅ Load data from JSON files
- ✅ Create sample login sessions
- ✅ Create sample activity logs
- ✅ Verify everything

---

### **Method 2: Manual SQL Execution**

If you prefer to run SQL manually:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in sidebar

2. **Copy SQL File**
   - Open `backend/add-missing-tables.sql`
   - Copy all contents (Ctrl+A, Ctrl+C)

3. **Run in Supabase**
   - Paste in SQL Editor
   - Click "Run" button
   - Wait for completion

---

## 📊 What Will Be Created

### 1. Users Table
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sample Data**: 2 users from `users.json`

---

### 2. Login Sessions Table
```sql
CREATE TABLE public.login_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token TEXT UNIQUE,
    device_info TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sample Data**: 2 login sessions for existing users

---

### 3. Shops_New Table
```sql
CREATE TABLE public.shops_new (
    id UUID PRIMARY KEY,
    shop_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    distance TEXT,
    image_url TEXT,
    contact_phone TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    delivery_available BOOLEAN DEFAULT true,
    avg_rating DECIMAL(3, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sample Data**: 3 shops from `shops.json`

---

### 4. User Activity Logs Table
```sql
CREATE TABLE public.user_activity_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    metadata JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sample Data**: 8 activity logs (LOGIN, VIEW_PRODUCT, ADD_TO_CART, PLACE_ORDER)

---

## ✅ Features Included

### Security
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Policies** for authenticated users
- ✅ **Service role** access for backend
- ✅ **Foreign key constraints** for data integrity

### Performance
- ✅ **Indexes** on frequently queried columns
- ✅ **Optimized** for fast lookups
- ✅ **Proper data types** for each column

### Data Management
- ✅ **Auto-generated UUIDs** for primary keys
- ✅ **Timestamps** (created_at, updated_at)
- ✅ **Triggers** to auto-update timestamps
- ✅ **UPSERT** support (no duplicates)

---

## 🧪 Testing

### After Running Migration

```bash
# Check if tables were created
cd backend
node -e "
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DIRECT_URL, 
  ssl: { rejectUnauthorized: false } 
});

const client = await pool.connect();
const result = await client.query(\`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'login_sessions', 'shops_new', 'user_activity_logs')
\`);

console.log('Tables found:', result.rows.map(r => r.table_name));
client.release();
await pool.end();
"
```

### Expected Output
```
Tables found: [ 
  'login_sessions',
  'shops_new', 
  'user_activity_logs', 
  'users' 
]
```

---

## 📊 Data Summary

After migration, you will have:

| Table | Records | Description |
|-------|---------|-------------|
| **users** | 2 | Test User, Jk |
| **login_sessions** | 2 | Active sessions for users |
| **shops_new** | 3 | Fresh Farm Meats, City Chicken Center, Mutton & More |
| **user_activity_logs** | 8 | Sample user activities |
| **Total** | **15** | **New records** |

---

## 🔧 Troubleshooting

### Issue: "Table already exists"
**Solution**: This is fine! The script uses `CREATE TABLE IF NOT EXISTS`, so it won't fail if tables exist.

### Issue: "Permission denied"
**Solution**: Make sure you're using the service role key or have proper permissions in Supabase.

### Issue: "Connection timeout"
**Solution**: 
1. Check your `.env` file has correct `DATABASE_URL` or `DIRECT_URL`
2. Verify internet connection
3. Try running from Supabase SQL Editor instead

### Issue: "Foreign key constraint fails"
**Solution**: Make sure to run the entire SQL file in order. Users table must be created before login_sessions and user_activity_logs.

---

## 📝 Files Created

### SQL Migration
- **`backend/add-missing-tables.sql`**
  - Complete SQL with CREATE TABLE, INSERT, indexes, triggers, RLS

### Node.js Script
- **`backend/src/scripts/add-missing-tables.js`**
  - Automated migration script
  - Uses direct PostgreSQL connection
  - Loads data from JSON files

### Package.json Script
- **`npm run add:missing-tables`**
  - Runs the migration script
  - Easy one-command execution

---

## 🎯 Next Steps

### 1. Run Migration
```bash
cd backend
npm run add:missing-tables
```

### 2. Verify in Supabase Dashboard
- Go to Table Editor
- Check for new tables:
  - users
  - login_sessions
  - shops_new
  - user_activity_logs

### 3. Test API Endpoints
If your backend has endpoints for these tables, test them:
```bash
# Example: Get users
curl https://taaza-customer.vercel.app/api/users

# Example: Get activity logs
curl https://taaza-customer.vercel.app/api/activity-logs
```

---

## 📖 Table Relationships

```
users
  ├── login_sessions (user_id → users.id)
  └── user_activity_logs (user_id → users.id)

shops_new (independent)
```

---

## 🔐 Security Notes

### RLS Policies Created:
- **Users**: Can view/update their own data
- **Login Sessions**: Users can view their own sessions
- **Shops_new**: Anyone can view active shops
- **Activity Logs**: Users can view their own activity
- **Service Role**: Can manage all data

### Best Practices:
- ✅ Never expose service role key to frontend
- ✅ Use authenticated user tokens for API calls
- ✅ Validate all user inputs
- ✅ Use parameterized queries to prevent SQL injection

---

## 💡 Usage Examples

### Query Users
```sql
SELECT * FROM public.users WHERE phone = '6303407430';
```

### Check Active Sessions
```sql
SELECT * FROM public.login_sessions WHERE is_active = true;
```

### View Activity Logs
```sql
SELECT * FROM public.user_activity_logs 
WHERE user_id = 'df5af33f-cf91-48f6-9eb4-64ea820b78c3'
ORDER BY created_at DESC;
```

### Get Nearby Shops
```sql
SELECT * FROM public.shops_new 
WHERE is_active = true 
ORDER BY shop_id;
```

---

## ✅ Success Checklist

After running migration, verify:
- [ ] All 4 tables created in Supabase
- [ ] Data loaded (15 total records)
- [ ] Indexes created (check Table Editor → Indexes)
- [ ] RLS enabled (check Table Editor → Policies)
- [ ] Triggers working (update a record, check updated_at)
- [ ] Foreign keys enforced (try deleting a user with sessions)

---

## 🎉 Summary

This migration adds **4 essential tables** to your Supabase database:
1. ✅ **users** - User accounts with authentication
2. ✅ **login_sessions** - Session management
3. ✅ **shops_new** - Enhanced shop information
4. ✅ **user_activity_logs** - Activity tracking

**Total Records Added**: 15
- 2 users
- 2 login sessions
- 3 shops
- 8 activity logs

**Ready to use!** 🚀

---

## 📞 Quick Commands

```bash
# Run migration
cd backend
npm run add:missing-tables

# Verify tables
node src/scripts/check-tables.js

# Check data
npm run check:data
```

---

**🎊 All missing tables will be added with proper structure, indexes, and sample data!**

