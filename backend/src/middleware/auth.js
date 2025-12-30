/**
 * Authentication Middleware
 * Validates backend tokens and Supabase Auth tokens
 */

import { supabaseAdmin } from '../config/database.js';

/**
 * Verify backend token
 */
function verifyBackendToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    // Token expires after 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > thirtyDays) {
      return null;
    }
    return payload.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Verify Supabase Auth token
 */
async function verifySupabaseToken(token) {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin || !supabaseAdmin.auth) {
      console.error('❌ Supabase Admin client not initialized. Check environment variables.');
      return null;
    }
    
    // Use Supabase Admin to verify the token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      // Log the error for debugging but don't expose Supabase internals
      console.error('Supabase token verification error:', error.message);
      
      // If it's an API key error, it means Supabase config is wrong
      if (error.message?.includes('Invalid API key') || error.message?.includes('api key')) {
        console.error('⚠️  CRITICAL: Supabase API keys are incorrect or missing!');
        console.error('⚠️  Please check Vercel environment variables:');
        console.error('    - SUPABASE_URL');
        console.error('    - SUPABASE_ANON_KEY');
        console.error('    - SUPABASE_SERVICE_ROLE_KEY');
        console.error('⚠️  See VERCEL_ENV_SETUP_GUIDE.md for setup instructions.');
      }
      
      return null;
    }
    
    if (!user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    // Check if it's a configuration error
    if (error.message?.includes('Invalid API key') || error.message?.includes('Supabase not configured')) {
      console.error('❌ Backend Supabase configuration error. Check Vercel environment variables.');
    }
    return null;
  }
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' },
      });
    }

    const token = authHeader.substring(7);
    
    // Try backend token first
    let userId = verifyBackendToken(token);
    
    // If backend token doesn't work, try Supabase token
    if (!userId) {
      userId = await verifySupabaseToken(token);
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' },
      });
    }

    // Attach user to request
    req.userId = userId;

    // Update last activity for session (async, don't block)
    import('../utils/activityLogger.js').then(({ updateLastActivity }) => {
      updateLastActivity(req).catch(err => console.error('Error updating last activity:', err));
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Authentication failed';
    if (error?.message?.includes('Invalid API key')) {
      errorMessage = 'Server configuration error. Please contact support.';
      console.error('⚠️  Supabase API key error detected. Check environment variables.');
    }
    
    res.status(401).json({
      success: false,
      error: { message: errorMessage },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try backend token first
      let userId = verifyBackendToken(token);
      
      // If backend token doesn't work, try Supabase token
      if (!userId) {
        userId = await verifySupabaseToken(token);
      }
      
      if (userId) {
        req.userId = userId;
      }
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};

