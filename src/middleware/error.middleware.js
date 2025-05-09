import { ValidationError, NotFoundError, AuthenticationError, DiscountCodeError } from '../errors/custom.errors.js';

/**
 * Global error handling middleware
 * Captures all errors thrown in the application and formats them into a consistent response
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error('Error:', err);

  // Default error values
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorDetails = null;

  // Handle specific error types
  if (err instanceof DiscountCodeError) {
    statusCode = 400;
    errorMessage = err.message;
    errorDetails = 'Discount code validation failed';
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    errorMessage = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorMessage = err.message;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorMessage = err.message;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    errorMessage = 'Database operation failed';
    errorDetails = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorMessage = 'Invalid token';
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    details: errorDetails,
    code: err.code || null
  });
}; 