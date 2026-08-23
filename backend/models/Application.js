const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      maxlength: 800,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// A student can never apply to the same project twice
applicationSchema.index({ project: 1, student: 1 }, { unique: true });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
