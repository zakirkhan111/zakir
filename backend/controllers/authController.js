const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendWelcomeEmail, sendEmail } = require('../utils/emailService');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + (Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: user.toSafeObject() },
  });
};

// @route POST /api/v1/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, city, skills, role } = req.body;

  if (!name || !email || !password || !phone || !city) {
    return next(new AppError('Name, email, password, phone, and city are required.', 400));
  }

  // Prevent self-registering as admin
  const safeRole = ['student', 'project_manager'].includes(role) ? role : 'student';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    city,
    skills: Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    role: safeRole,
    profilePicture: req.file ? { url: req.file.path } : undefined,
  });

  sendWelcomeEmail(user).catch((err) => console.error('Welcome email failed:', err.message));

  createSendToken(user, 201, res);
});

// @route POST /api/v1/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Contact support.', 403));
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

// @route POST /api/v1/auth/logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
};

// @route GET /api/v1/auth/me
exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({ status: 'success', data: { user: req.user.toSafeObject() } });
});

// @route PATCH /api/v1/auth/update-password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res);
});

// @route POST /api/v1/auth/forgot-password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No account found with that email.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your ImpactHub Password Reset (valid for 10 min)',
      html: `<p>Forgot your password? Click the link below to reset it. If you didn't request this, ignore this email.</p><p><a href="${resetURL}">${resetURL}</a></p>`,
    });
    res.status(200).json({ status: 'success', message: 'Password reset link sent to email.' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later.', 500));
  }
});

// @route PATCH /api/v1/auth/reset-password/:token
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  if (!req.body.password) {
    return next(new AppError('Please provide a new password.', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});
