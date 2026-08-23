const Comment = require('../models/Comment');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createNotification } = require('./notificationController');
const { emitToProject } = require('../utils/socket');

// @route POST /api/v1/comments  (project member)
exports.createComment = catchAsync(async (req, res, next) => {
  const { projectId, text, parentComment } = req.body;
  if (!projectId || !text) return next(new AppError('projectId and text are required.', 400));

  const project = await Project.findById(projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
  const isManager = project.projectManager.toString() === req.user._id.toString();
  if (!isMember && !isManager && req.user.role !== 'admin') {
    return next(new AppError('Only project members can comment on this project.', 403));
  }

  let parent = null;
  if (parentComment) {
    parent = await Comment.findById(parentComment);
    if (!parent || parent.project.toString() !== projectId) {
      return next(new AppError('Invalid parent comment.', 400));
    }
  }

  const comment = await Comment.create({
    project: projectId,
    author: req.user._id,
    text,
    parentComment: parentComment || null,
  });

  await comment.populate('author', 'name profilePicture role');

  emitToProject(projectId, 'comment:new', comment);

  const recipientId = parent ? parent.author : project.projectManager;
  if (recipientId.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: parent ? 'new_reply' : 'new_comment',
      title: parent ? 'New Reply' : 'New Comment',
      message: `${req.user.name} ${parent ? 'replied to a comment' : 'commented'} on "${project.title}".`,
      relatedProject: project._id,
    });
  }

  res.status(201).json({ status: 'success', data: { comment } });
});

// @route GET /api/v1/comments/project/:projectId
exports.getProjectComments = catchAsync(async (req, res, next) => {
  const topLevel = await Comment.find({ project: req.params.projectId, parentComment: null, isDeleted: false })
    .populate('author', 'name profilePicture role')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: { path: 'author', select: 'name profilePicture role' },
    })
    .sort('-createdAt');

  res.status(200).json({ status: 'success', results: topLevel.length, data: { comments: topLevel } });
});

// @route DELETE /api/v1/comments/:id  (own comment only)
exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found.', 404));

  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own comments.', 403));
  }

  comment.isDeleted = true;
  comment.text = '[deleted]';
  await comment.save();

  emitToProject(comment.project, 'comment:deleted', { commentId: comment._id });

  res.status(204).json({ status: 'success', data: null });
});
