const AppError = require('../utils/AppError');

// Role-based authorization guard. Usage: restrictTo('admin', 'project_manager')
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You are not logged in.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = restrictTo;
