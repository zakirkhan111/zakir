const AppError = require('../utils/AppError');

// Generic body validator: pass a map of field -> validator function
// Usage: validateBody({ email: (v) => typeof v === 'string' && v.includes('@') })
const validateBody = (rules) => (req, res, next) => {
  const errors = [];
  Object.entries(rules).forEach(([field, rule]) => {
    const { required = true, validator, message } = rule;
    const value = req.body[field];

    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return;
    }
    if (value !== undefined && value !== null && value !== '' && validator && !validator(value)) {
      errors.push(message || `${field} is invalid`);
    }
  });

  if (errors.length) {
    return next(new AppError(errors.join('. '), 400));
  }
  next();
};

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isNumber = (v) => !Number.isNaN(Number(v));
const isMongoId = (v) => /^[0-9a-fA-F]{24}$/.test(v);

module.exports = { validateBody, isNonEmptyString, isEmail, isNumber, isMongoId };
