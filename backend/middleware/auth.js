const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Verifies JWT (from Authorization header or cookie) and attaches req.user
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (currentUser.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Contact support.', 403));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  req.user = currentUser;
  next();
});

// Attaches req.user if a valid token is present, but never blocks the request
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.status !== 'suspended') {
      req.user = currentUser;
    }
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
});
