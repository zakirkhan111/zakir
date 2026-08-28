const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createNotification } = require('./notificationController');
const { sendTaskAssignedEmail } = require('../utils/emailService');
const { POINTS, calculateCompletionPercentage } = require('../utils/impactScore');
const { recalculateProjectImpactScore } = require('./projectController');

// Recomputes and persists totalTasks/completedTasks/completionPercentage for a project
async function syncProjectTaskCounters(projectId) {
  const [totalTasks, completedTasks] = await Promise.all([
    Task.countDocuments({ project: projectId }),
    Task.countDocuments({ project: projectId, status: 'COMPLETED' }),
  ]);

  const completionPercentage = calculateCompletionPercentage(totalTasks, completedTasks);

  await Project.findByIdAndUpdate(projectId, {
    totalTasks,
    completedTasks,
    completionPercentage,
    status: completionPercentage === 100 && totalTasks > 0 ? 'completed' : undefined,
  });

  await recalculateProjectImpactScore(projectId);
}

// @route POST /api/v1/tasks  (project_manager, owner)
exports.createTask = catchAsync(async (req, res, next) => {
  const { projectId, title, description, assignedTo, priority, deadline } = req.body;
  if (!projectId || !title || !deadline) {
    return next(new AppError('projectId, title, and deadline are required.', 400));
  }

  const project = await Project.findById(projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to assign tasks on this project.', 403));
  }

  if (assignedTo) {
    const isMember = project.members.some((m) => m.user.toString() === assignedTo.toString());
    if (!isMember) return next(new AppError('Assigned user must be a member of this project.', 400));
  }

  const task = await Task.create({
    project: projectId,
    title,
    description,
    assignedTo: assignedTo || null,
    assignedBy: req.user._id,
    priority: priority || 'MEDIUM',
    deadline,
  });

  await syncProjectTaskCounters(projectId);

  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    await createNotification({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned "${task.title}" on "${project.title}".`,
      relatedProject: project._id,
      relatedTask: task._id,
    });
    sendTaskAssignedEmail(assignee, task, project).catch((err) => console.error('Task email failed:', err.message));
  }

  res.status(201).json({ status: 'success', data: { task } });
});

// @route GET /api/v1/tasks/project/:projectId  (kanban board data)
exports.getProjectTasks = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId).select('projectManager members');
  if (!project) return next(new AppError('Project not found.', 404));

  const isManager = project.projectManager.toString() === req.user._id.toString();
  const isMember = project.members.some((member) => member.user.toString() === req.user._id.toString());
  if (req.user.role === 'student' && !isMember) {
    return next(new AppError('You must be an approved project member to view its tasks.', 403));
  }

  const filter = { project: project._id };
  if (req.user.role === 'student') filter.assignedTo = req.user._id;
  if (!isManager && req.user.role !== 'student' && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these tasks.', 403));
  }

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name profilePicture')
    .populate('assignedBy', 'name')
    .sort('-createdAt');

  const board = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
  };

  res.status(200).json({ status: 'success', results: tasks.length, data: { tasks, board } });
});

// @route GET /api/v1/tasks/mine  (student)
exports.getMyTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('project', 'title category status')
    .sort('-createdAt');
  res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
});

// @route PATCH /api/v1/tasks/:id/status  (student assignee, or manager)
exports.updateTaskStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
    return next(new AppError('Status must be TODO, IN_PROGRESS, or COMPLETED.', 400));
  }

  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return next(new AppError('Task not found.', 404));

  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  const isManager = task.project.projectManager.toString() === req.user._id.toString();
  if (!isAssignee && !isManager) {
    return next(new AppError('You are not authorized to update this task.', 403));
  }

  const wasCompleted = task.status === 'COMPLETED';
  task.status = status;
  task.completedAt = status === 'COMPLETED' ? new Date() : null;
  await task.save();

  await syncProjectTaskCounters(task.project._id);

  if (status === 'COMPLETED' && !wasCompleted) {
    if (task.assignedTo) {
      await User.findByIdAndUpdate(task.assignedTo, {
        $inc: { volunteerPoints: POINTS.COMPLETE_TASK, 'stats.tasksCompleted': 1, 'stats.hoursContributed': 2 },
      });
    }
    await createNotification({
      recipient: task.project.projectManager,
      sender: req.user._id,
      type: 'task_completed',
      title: 'Task Completed',
      message: `"${task.title}" was marked completed on "${task.project.title}".`,
      relatedProject: task.project._id,
      relatedTask: task._id,
    });
  }

  res.status(200).json({ status: 'success', data: { task } });
});

// @route PATCH /api/v1/tasks/:id  (manager — reassign, edit deadline/priority)
exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return next(new AppError('Task not found.', 404));

  if (task.project.projectManager.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to edit this task.', 403));
  }

  const allowedFields = ['title', 'description', 'assignedTo', 'priority', 'deadline'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  res.status(200).json({ status: 'success', data: { task } });
});

// @route DELETE /api/v1/tasks/:id  (manager)
exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return next(new AppError('Task not found.', 404));

  if (task.project.projectManager.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to delete this task.', 403));
  }

  const projectId = task.project._id;
  await task.deleteOne();
  await syncProjectTaskCounters(projectId);

  res.status(204).json({ status: 'success', data: null });
});
