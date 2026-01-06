// Simple test endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working!',
    env_check: {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    },
    timestamp: new Date().toISOString(),
  });
}





