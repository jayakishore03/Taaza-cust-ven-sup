/**
 * API Configuration
 * 
 * Vendor App API Base URL
 * Using the production Vercel deployment which is accessible from anywhere
 */

export const API_CONFIG = {
  // Using the SAME Vercel backend as customer app for consistency
  // This ensures both apps share the same database and orders
  // Customer app uses: https://taaza-customer.vercel.app/api
  // Vendor app now uses the same backend for unified data
  // NOTE: If you get 401 HTML responses, disable Deployment Protection in Vercel Dashboard
  // Settings → Deployment Protection → Disable Password Protection/Vercel Authentication
  BASE_URL: 'https://taaza-customer.vercel.app/api',
  
  // Backend health check endpoint (without /api)
  HEALTH_CHECK_URL: 'https://taaza-customer.vercel.app/health',
};

