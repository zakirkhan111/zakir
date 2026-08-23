const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    parentComment: {
      // Set when this comment is a reply to another comment (one level of nesting)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ project: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

// Virtual populate to fetch replies of a top-level comment
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
});

commentSchema.set('toObject', { virtuals: true });
commentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
