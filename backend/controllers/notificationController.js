const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { emitToUser } = require('../utils/socket');

// Internal helper — used by other controllers to create + emit a notification in one call
async function createNotification({ recipient, sender = null, type, title, message, link = '', relatedProject, relatedTask }) {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    link,
    relatedProject,
    relatedTask,
  });

  try {
    emitToUser(recipient, 'notification:new', notification);
  } catch (err) {
    // Socket.io may not be initialized in some contexts (e.g. scripts) — safe to ignore
  }

  return notification;
}

// @route GET /api/v1/notifications  (authenticated user)
exports.getMyNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const filter = { recipient: req.user._id };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    Notification.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    total,
    unreadCount,
    page,
    pages: Math.ceil(total / limit),
    data: { notifications },
  });
});

// @route PATCH /api/v1/notifications/:id/read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found.', 404));
  res.status(200).json({ status: 'success', data: { notification } });
});

// @route PATCH /api/v1/notifications/read-all
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ status: 'success', message: 'All notifications marked as read.' });
});

// @route DELETE /api/v1/notifications/:id
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) return next(new AppError('Notification not found.', 404));
  res.status(204).json({ status: 'success', data: null });
});

exports.createNotification = createNotification;
