// Vercel Serverless Function Entry Point
// This file is the entry point for Vercel serverless functions

// Log environment variables status (without exposing secrets)
console.log('🔍 Environment Check on Function Start:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

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

