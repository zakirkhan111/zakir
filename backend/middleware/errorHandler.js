const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue ? err.keyValue[field] : '';
  if (err.keyPattern && err.keyPattern.project && err.keyPattern.student) {
    return new AppError('You have already applied to this project.', 409);
  }
  return new AppError(`Duplicate value for field "${field}": ${value}. Please use another value.`, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.error('💥 UNEXPECTED ERROR', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on our end. Please try again later.',
  });
};

// Global error handling middleware — must be registered last in server.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
