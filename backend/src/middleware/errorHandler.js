/**
 * Error Handler Middleware
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Provide more user-friendly error messages
  if (message.includes('Server configuration error') || 
      message.includes('Supabase credentials are invalid') ||
      message.includes('Supabase not configured')) {
    // Format the configuration error message for users
    message = 'The server is not properly configured. Please contact support or try again later.';
  } else if (message.includes('Invalid API key') || message.includes('JWT')) {
    message = 'The server is not properly configured. Please contact support or try again later.';
  } else if (statusCode === 500 && !message.includes('Server configuration')) {
    // For generic 500 errors, provide a user-friendly message
    message = 'An error occurred while processing your request. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        originalError: err.message,
        code: err.code 
      }),
    },
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

