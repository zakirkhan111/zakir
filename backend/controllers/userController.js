const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @route PATCH /api/v1/users/profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'city', 'skills', 'bio'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (typeof updates.skills === 'string') {
    updates.skills = updates.skills.split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (req.file) {
    updates.profilePicture = { url: req.file.path };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});

// @route GET /api/v1/users/:id
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});

// @route GET /api/v1/users/leaderboard/contributors
exports.getLeaderboard = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const users = await User.find({ role: { $in: ['student', 'project_manager'] }, status: 'active' })
    .sort('-volunteerPoints')
    .limit(limit)
    .select('name profilePicture volunteerPoints stats city badges');

  res.status(200).json({ status: 'success', results: users.length, data: { leaderboard: users } });
});

// @route GET /api/v1/users/me/stats
exports.getMyStats = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('stats volunteerPoints badges');
  res.status(200).json({ status: 'success', data: { stats: user.stats, volunteerPoints: user.volunteerPoints, badges: user.badges } });
});
