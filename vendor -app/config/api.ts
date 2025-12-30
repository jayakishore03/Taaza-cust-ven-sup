/**
 * API Configuration
 * 
 * Vendor App API Base URL
 * Using the production Vercel deployment which is accessible from anywhere
 */

export const API_CONFIG = {
  // Using the production Vercel API endpoint for vendor app
  // This backend deployment includes the /api/vendor/orders endpoint and has all env vars configured
  // NOTE: If you get 401 HTML responses, disable Deployment Protection in Vercel Dashboard
  // Settings → Deployment Protection → Disable Password Protection/Vercel Authentication
  BASE_URL: 'https://backend-three-neon-66.vercel.app/api',
  
  // Backend health check endpoint (without /api)
  HEALTH_CHECK_URL: 'https://backend-three-neon-66.vercel.app/health',
};

