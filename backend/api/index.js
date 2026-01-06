// Vercel Serverless Function Entry Point
// This file is the entry point for Vercel serverless functions

// Log environment variables status (without exposing secrets)
console.log('🔍 Environment Check on Function Start:');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Detailed URL validation and logging
if (supabaseUrl) {
  const trimmed = supabaseUrl.trim();
  const length = trimmed.length;
  const startsWithHttps = trimmed.startsWith('https://');
  const isValidFormat = /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co$/.test(trimmed);
  
  console.log('  SUPABASE_URL: ✅ SET');
  console.log(`    Length: ${length} characters`);
  console.log(`    Starts with https://: ${startsWithHttps ? '✅' : '❌'}`);
  console.log(`    Valid format: ${isValidFormat ? '✅' : '❌'}`);
  console.log(`    Preview: ${trimmed.substring(0, 50)}${length > 50 ? '...' : ''}`);
  console.log(`    First 20 chars: "${trimmed.substring(0, 20)}"`);
  console.log(`    Last 20 chars: "${trimmed.substring(Math.max(0, length - 20))}"`);
  
  // Check for common issues
  if (trimmed !== supabaseUrl) {
    console.log('    ⚠️  WARNING: URL has leading/trailing whitespace!');
  }
  if (!startsWithHttps) {
    console.log('    ❌ ERROR: URL does not start with https://');
  }
  if (!isValidFormat) {
    console.log('    ❌ ERROR: URL format is invalid');
  }
} else {
  console.log('  SUPABASE_URL: ❌ MISSING');
}

console.log('  SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ SET (${supabaseAnonKey.substring(0, 20)}...)` : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? `✅ SET (${supabaseServiceRoleKey.substring(0, 20)}...)` : '❌ MISSING');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

// If environment variables are missing or invalid, log a warning
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  WARNING: Supabase environment variables are missing!');
  console.error('   This will cause "Invalid API key" errors.');
  console.error('   Please check Vercel Dashboard → Settings → Environment Variables');
} else {
  const trimmedUrl = supabaseUrl.trim();
  const isValidUrl = /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co$/.test(trimmedUrl);
  if (!isValidUrl) {
    console.error('⚠️  WARNING: SUPABASE_URL format is invalid!');
    console.error(`   Current value: "${trimmedUrl}"`);
    console.error('   Expected format: https://your-project.supabase.co');
    console.error('   Please check Vercel Dashboard → Settings → Environment Variables');
  }
}

let app;

try {
  console.log('📦 Loading Express app from ../src/server.js...');
  const serverModule = await import('../src/server.js');
  app = serverModule.default;
  
  if (!app) {
    throw new Error('Express app is undefined - server.js did not export default app');
  }
  
  console.log('✅ Express app loaded successfully');
  console.log('  App type:', typeof app);
  console.log('  App has use method:', typeof app.use === 'function');
} catch (error) {
  console.error('❌ CRITICAL: Error loading Express app');
  console.error('  Error name:', error.name);
  console.error('  Error code:', error.code);
  console.error('  Error message:', error.message);
  console.error('  Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  
  // Log the full stack trace
  if (error.stack) {
    console.error('  Error stack:', error.stack);
  }
  
  // If it's a module not found error, log more details
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('  🔴 MODULE NOT FOUND ERROR');
    console.error('  This usually means:');
    console.error('    1. A file is missing');
    console.error('    2. An import path is incorrect');
    console.error('    3. A file extension is missing (.js)');
    console.error('  Check the error message above for the missing module path');
  }
  
  // Create a fallback error handler
  app = (req, res) => {
    console.error('⚠️ Request received but server failed to initialize');
    console.error('  Method:', req.method);
    console.error('  URL:', req.url);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Server initialization failed',
        details: error.message,
      name: error.name,
        code: error.code,
        hint: error.code === 'ERR_MODULE_NOT_FOUND' 
          ? 'A module import failed. Check Vercel logs for the missing module path.'
          : 'Check Vercel logs for full error details',
        // Always show stack for debugging in Vercel
        stack: error.stack,
      },
    });
  };
}

// Export the Express app for Vercel
// Vercel will use this as the serverless function handler
export default app;

