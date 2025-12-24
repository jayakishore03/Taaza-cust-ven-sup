// Vercel Serverless Function Entry Point
let app;

try {
  const serverModule = await import('../src/server.js');
  app = serverModule.default;
} catch (error) {
  console.error('❌ Error loading Express app:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  
  // Return a detailed error handler if app fails to load
  app = (req, res) => {
    console.error('Request to failed server:', req.method, req.url);
    res.status(500).json({
      success: false,
      error: 'Server initialization failed',
      message: error.message,
      name: error.name,
      // Only show stack in non-production
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
  };
}

export default app;

