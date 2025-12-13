/**
 * API Configuration
 * 
 * Vendor App API Base URL
 * Using the production Vercel deployment which is accessible from anywhere
 */

export const API_CONFIG = {
  // Using the production Vercel API endpoint for vendor app
  // This works from any device/network without needing local IP configuration
  BASE_URL: 'https://taaza-customer.vercel.app/api',
  
  // Backend health check endpoint (without /api)
  HEALTH_CHECK_URL: 'https://taaza-customer.vercel.app/health',
};

