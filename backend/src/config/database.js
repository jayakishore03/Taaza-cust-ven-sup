/**
 * Supabase Database Configuration
 * Uses Supabase (PostgreSQL) for database operations
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables are automatically injected by Vercel
// Trim whitespace and validate URLs
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

let supabase;
let supabaseAdmin;

// Validate URL format
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
  console.error('========================================');
  console.error('❌ CRITICAL: Missing or Invalid Supabase environment variables!');
  console.error('========================================');
  console.error(`SUPABASE_URL: ${supabaseUrl ? (isValidUrl(supabaseUrl) ? '✅ VALID' : `❌ INVALID: "${supabaseUrl}" (must be a valid HTTP/HTTPS URL)`) : '❌ MISSING'}`);
  console.error(`SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ SET' : '❌ MISSING'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅ SET' : '❌ MISSING'}`);
  console.error('');
  if (!isValidUrl(supabaseUrl) && supabaseUrl) {
    console.error('⚠️  SUPABASE_URL is set but invalid!');
    console.error(`   Current value: "${supabaseUrl}"`);
    console.error('   Expected format: https://your-project.supabase.co');
    console.error('');
  }
  console.error('⚠️  API will return "Invalid API key" errors for all database operations');
  console.error('');
  console.error('🔧 TO FIX:');
  console.error('   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.error('   2. Verify/Update these variables:');
  console.error('      - SUPABASE_URL: https://fcrhcwvpivkadkkbxcom.supabase.co');
  console.error('      - SUPABASE_ANON_KEY: (your anon key)');
  console.error('      - SUPABASE_SERVICE_ROLE_KEY: (your service role key)');
  console.error('   3. Make sure SUPABASE_URL starts with https:// and has no extra spaces');
  console.error('   4. Redeploy your project');
  console.error('');
  console.error('📖 See VERCEL_ENV_SETUP_GUIDE.md for detailed instructions');
  console.error('========================================');
  
  // Create mock client that returns errors
  const createMockQuery = () => ({
    select: () => createMockQuery(),
    insert: () => createMockQuery(),
    update: () => createMockQuery(),
    delete: () => createMockQuery(),
    eq: () => createMockQuery(),
    single: () => createMockQuery(),
    order: () => createMockQuery(),
    limit: () => createMockQuery(),
    then: (resolve) => resolve({ data: null, error: { message: 'Supabase not configured' } }),
  });
  
  const createMockRpc = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
  
  const mockClient = {
    from: () => createMockQuery(),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
    },
    rpc: createMockRpc,
  };
  
  supabase = mockClient;
  supabaseAdmin = mockClient;
} else {
  // Create Supabase client for regular operations (uses anon key, respects RLS)
  try {
    // Double-check URL is valid before creating client
    if (!isValidUrl(supabaseUrl)) {
      throw new Error(`Invalid SUPABASE_URL: "${supabaseUrl}" - Must be a valid HTTP or HTTPS URL`);
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized with anon key');
    console.log(`   URL: ${supabaseUrl.substring(0, 40)}...`);
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    console.error('   This usually means SUPABASE_URL is invalid or malformed');
    throw error;
  }
  
  // Create Supabase admin client for admin operations (uses service role key, bypasses RLS)
  if (supabaseServiceRoleKey) {
    try {
      // Double-check URL is valid before creating admin client
      if (!isValidUrl(supabaseUrl)) {
        throw new Error(`Invalid SUPABASE_URL: "${supabaseUrl}" - Must be a valid HTTP or HTTPS URL`);
      }
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      console.log('✅ Supabase admin client initialized with service role key');
    } catch (error) {
      console.error('❌ Failed to create Supabase admin client:', error);
      console.error('⚠️  Falling back to regular Supabase client (may have RLS restrictions)');
      supabaseAdmin = supabase;
    }
  } else {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not provided, using regular client');
    supabaseAdmin = supabase;
  }
}

// Wrap Supabase clients to add custom RPC functions
// Safely bind RPC methods
let originalRpcSupabase;
let originalRpcSupabaseAdmin;

try {
  if (supabase && typeof supabase.rpc === 'function') {
    originalRpcSupabase = supabase.rpc.bind(supabase);
  } else {
    originalRpcSupabase = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
  }
} catch (error) {
  console.warn('Failed to bind supabase.rpc:', error);
  originalRpcSupabase = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
}

try {
  if (supabaseAdmin && typeof supabaseAdmin.rpc === 'function') {
    originalRpcSupabaseAdmin = supabaseAdmin.rpc.bind(supabaseAdmin);
  } else {
    originalRpcSupabaseAdmin = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
  }
} catch (error) {
  console.warn('Failed to bind supabaseAdmin.rpc:', error);
  originalRpcSupabaseAdmin = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
}

/**
 * Generate order number
 * Counts existing orders and generates a sequential order number
 */
async function generateOrderNumber() {
  try {
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting orders:', error);
      return { data: `#TAZ${Date.now()}`, error: null };
    }
    
    const orderNum = (count || 0) + 1000;
    return { data: `#TAZ${orderNum}`, error: null };
  } catch (error) {
    console.error('Error generating order number:', error);
    return { data: `#TAZ${Date.now()}`, error: null };
  }
}

/**
 * Generate OTP
 */
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return { data: otp, error: null };
}

// Override RPC method to handle custom functions
// Only override if clients exist
if (supabase && typeof supabase.rpc === 'function') {
  supabase.rpc = async (functionName, params = {}) => {
    if (functionName === 'generate_order_number') {
      return generateOrderNumber();
    }
    if (functionName === 'generate_otp') {
      return generateOTP();
    }
    // For other RPC functions, use Supabase's built-in RPC
    return await originalRpcSupabase(functionName, params);
  };
}

if (supabaseAdmin && typeof supabaseAdmin.rpc === 'function') {
  supabaseAdmin.rpc = async (functionName, params = {}) => {
    if (functionName === 'generate_order_number') {
      return generateOrderNumber();
    }
    if (functionName === 'generate_otp') {
      return generateOTP();
    }
    // For other RPC functions, use Supabase's built-in RPC
    return await originalRpcSupabaseAdmin(functionName, params);
  };
}

export { supabase, supabaseAdmin };
export default supabase;
