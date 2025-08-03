/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 * Provides different error responses for development vs production
 */

const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    deviceId: req.deviceId || 'unknown',
    timestamp: new Date().toISOString(),
    headers: process.env.NODE_ENV === 'development' ? req.headers : undefined
  });

  // Default error response
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorType = err.name || 'UnknownError';
  
  // Handle specific error types
  switch (errorType) {
    case 'ValidationError':
      status = 400;
      message = 'Invalid request data';
      break;
    
    case 'CastError':
      status = 400;
      message = 'Invalid ID format';
      break;
    
    case 'MongoError':
    case 'PostgresError':
      status = 500;
      message = 'Database error occurred';
      break;
    
    case 'JsonWebTokenError':
      status = 401;
      message = 'Invalid authentication token';
      break;
    
    case 'TokenExpiredError':
      status = 401;
      message = 'Authentication token expired';
      break;
    
    case 'MulterError':
      status = 400;
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large. Maximum size is 10MB';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = 'Too many files. Maximum is 1 file per request';
      } else {
        message = 'File upload error';
      }
      break;
  }

  // Handle OpenAI API errors
  if (err.response?.status) {
    switch (err.response.status) {
      case 401:
        status = 500;
        message = 'AI service authentication failed';
        break;
      case 429:
        status = 429;
        message = 'AI service rate limit exceeded. Please try again later';
        break;
      case 500:
        status = 502;
        message = 'AI service temporarily unavailable';
        break;
      default:
        status = 502;
        message = 'AI service error';
    }
  }

  // Handle Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        status = 409;
        message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        status = 400;
        message = 'Invalid reference';
        break;
      case '23502': // Not null violation
        status = 400;
        message = 'Required field missing';
        break;
      case 'PGRST116': // No rows returned
        status = 404;
        message = 'Resource not found';
        break;
    }
  }

  // Prepare error response
  const errorResponse = {
    error: message,
    type: errorType,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      originalMessage: err.message,
      stack: err.stack,
      deviceId: req.deviceId
    };
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Handle different error types with specific responses
  if (status >= 500) {
    // Server errors - log more details
    console.error('🔥 Server Error:', {
      error: err,
      request: {
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        body: req.body
      }
    });
    
    errorResponse.message = process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on our end. Please try again later.'
      : message;
  }

  // Send error response
  res.status(status).json(errorResponse);
};

// Async error wrapper utility
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /',
      'POST /api/scan',
      'GET /api/scan',
      'GET /api/scan/:id',
      'POST /api/purchase/webhook'
    ]
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
}; 