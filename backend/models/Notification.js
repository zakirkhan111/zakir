const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'application_approved',
        'application_rejected',
        'new_application',
        'task_assigned',
        'task_completed',
        'task_deadline_reminder',
        'new_comment',
        'new_reply',
        'project_submitted',
        'project_approved',
        'project_rejected',
        'certificate_issued',
        'badge_earned',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 150 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '' },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
