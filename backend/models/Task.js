const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
      default: 'TODO',
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline is required'],
    },
    completedAt: Date,
    attachments: [
      {
        url: String,
        publicId: String,
        fileName: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);
