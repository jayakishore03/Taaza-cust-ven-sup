/**
 * API Configuration
 * 
 * IMPORTANT: For device testing, update the IP address below to your computer's local IP
 * 
 * To find your IP address:
 * - Windows: Run `ipconfig` in CMD and look for "IPv4 Address"
 * - Mac/Linux: Run `ifconfig` or `ip addr` and look for your local network IP
 * 
 * Example: If your computer's IP is 192.168.1.100, change the URL to:
 * 'http://192.168.1.100:3000/api'
 */

export const API_CONFIG = {
  // Development: Use your computer's IP address for device testing
  // Production: Replace with your production API URL
  BASE_URL: __DEV__ 
    ? 'http://192.168.0.5:3000/api' // ⚠️ CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
    : 'https://taaza-customer.vercel.app/api',
  
  // Backend health check endpoint (without /api)
  HEALTH_CHECK_URL: __DEV__
    ? 'http://192.168.0.5:3000/health' // ⚠️ CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
    : 'https://taaza-customer.vercel.app/health',
};

