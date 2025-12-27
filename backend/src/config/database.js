/**
 * Supabase Database Configuration
 * Uses Supabase (PostgreSQL) for database operations
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables are automatically injected by Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let supabaseAdmin;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error(`SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
  console.error(`SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'SET' : 'MISSING'}`);
  console.error('⚠️  API will return errors for database operations');
  
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
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Create Supabase admin client for admin operations (uses service role key, bypasses RLS)
  supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : supabase;
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
