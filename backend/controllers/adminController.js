const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const { createNotification } = require('./notificationController');
const { sendCertificateEmail } = require('../utils/emailService');
const { POINTS } = require('../utils/impactScore');

// @route GET /api/v1/admin/users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query).search(['name', 'email']).filter().sort().limitFields().paginate();
  const [users, total] = await Promise.all([features.query, User.countDocuments()]);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: { users: users.map((u) => u.toSafeObject()) },
  });
});

// @route PATCH /api/v1/admin/users/:id/suspend
exports.toggleSuspendUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin') return next(new AppError('Admins cannot be suspended.', 400));

  user.status = user.status === 'active' ? 'suspended' : 'active';
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});

// @route DELETE /api/v1/admin/users/:id
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.role === 'admin') return next(new AppError('Admins cannot be deleted.', 400));

  await user.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});

// @route GET /api/v1/admin/projects
exports.getAllProjectsAdmin = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Project.find(), req.query).search(['title', 'description']).filter().sort().limitFields().paginate();
  const [projects, total] = await Promise.all([
    features.query.populate('projectManager', 'name email'),
    Project.countDocuments(),
  ]);

  res.status(200).json({
    status: 'success',
    results: projects.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: { projects },
  });
});

// @route PATCH /api/v1/admin/projects/:id/approve
exports.approveProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate('projectManager');
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.status !== 'pending_approval') return next(new AppError('This project is not pending approval.', 400));

  project.status = 'active';
  await project.save({ validateBeforeSave: false });

  await createNotification({
    recipient: project.projectManager._id,
    sender: req.user._id,
    type: 'project_approved',
    title: 'Project Approved',
    message: `Your project "${project.title}" has been approved and is now live.`,
    relatedProject: project._id,
  });

  res.status(200).json({ status: 'success', data: { project } });
});

// @route PATCH /api/v1/admin/projects/:id/reject
exports.rejectProject = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const project = await Project.findById(req.params.id).populate('projectManager');
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.status !== 'pending_approval') return next(new AppError('This project is not pending approval.', 400));

  project.status = 'rejected';
  project.rejectionReason = reason || '';
  await project.save({ validateBeforeSave: false });

  await createNotification({
    recipient: project.projectManager._id,
    sender: req.user._id,
    type: 'project_rejected',
    title: 'Project Rejected',
    message: `Your project "${project.title}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
    relatedProject: project._id,
  });

  res.status(200).json({ status: 'success', data: { project } });
});

// @route DELETE /api/v1/admin/projects/:id
exports.removeProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  await Task.deleteMany({ project: project._id });
  await Application.deleteMany({ project: project._id });
  await project.deleteOne();

  res.status(204).json({ status: 'success', data: null });
});

// @route GET /api/v1/admin/stats  (platform-wide statistics)
exports.getPlatformStats = catchAsync(async (req, res, next) => {
  const [totalUsers, usersByRole, totalProjects, projectsByStatus, projectsByCategory, totalVolunteersAgg] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Project.countDocuments(),
    Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Project.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Project.aggregate([{ $group: { _id: null, total: { $sum: '$currentVolunteersCount' } } }]),
  ]);

  const roleMap = { student: 0, project_manager: 0, admin: 0 };
  usersByRole.forEach((r) => { roleMap[r._id] = r.count; });

  const statusMap = { pending_approval: 0, active: 0, in_progress: 0, completed: 0, rejected: 0, cancelled: 0 };
  projectsByStatus.forEach((s) => { statusMap[s._id] = s.count; });

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers,
      usersByRole: roleMap,
      totalProjects,
      activeProjects: statusMap.active + statusMap.in_progress,
      completedProjects: statusMap.completed,
      pendingProjects: statusMap.pending_approval,
      totalVolunteers: totalVolunteersAgg[0]?.total || 0,
      projectsByCategory: projectsByCategory.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
      projectsByStatus: statusMap,
    },
  });
});

// @route GET /api/v1/admin/reports
exports.getReports = catchAsync(async (req, res, next) => {
  const topProjects = await Project.find({ status: 'completed' }).sort('-impactScore').limit(10).select('title category impactScore averageRating completedTasks');
  const topContributors = await User.find({ role: { $in: ['student'] } }).sort('-volunteerPoints').limit(10).select('name volunteerPoints stats');

  res.status(200).json({ status: 'success', data: { topProjects, topContributors } });
});

// @route POST /api/v1/admin/projects/:id/issue-certificates  (bulk-issue certificates for a completed project)
exports.issueCertificates = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).populate('members.user');
  if (!project) return next(new AppError('Project not found.', 404));
  if (project.status !== 'completed') return next(new AppError('Certificates can only be issued for completed projects.', 400));

  const Task = require('../models/Task');

  let issued = 0;
  for (const member of project.members) {
    const user = member.user;
    const tasksCompleted = await Task.countDocuments({ project: project._id, assignedTo: user._id, status: 'COMPLETED' });

    await sendCertificateEmail(user, project, {
      tasksCompleted,
      hoursContributed: tasksCompleted * 2,
      impactScore: project.impactScore,
    }).catch((err) => console.error('Certificate email failed:', err.message));

    await createNotification({
      recipient: user._id,
      type: 'certificate_issued',
      title: 'Certificate Issued 🎓',
      message: `Your certificate of appreciation for "${project.title}" has been emailed to you.`,
      relatedProject: project._id,
    });

    issued += 1;
  }

  res.status(200).json({ status: 'success', message: `Certificates issued to ${issued} member(s).` });
});
