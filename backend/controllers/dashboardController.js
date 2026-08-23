const Project = require('../models/Project');
const Task = require('../models/Task');
const Application = require('../models/Application');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

// @route GET /api/v1/dashboard/student
exports.getStudentDashboard = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const [user, joinedProjects, myTasks, completedTasksCount] = await Promise.all([
    User.findById(userId).select('stats volunteerPoints badges'),
    Project.find({ 'members.user': userId }).select('title status completionPercentage'),
    Task.find({ assignedTo: userId }),
    Task.countDocuments({ assignedTo: userId, status: 'COMPLETED' }),
  ]);

  const totalTasks = myTasks.length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
  const projectsCompleted = joinedProjects.filter((p) => p.status === 'completed').length;
  const projectCompletionRate = joinedProjects.length ? Math.round((projectsCompleted / joinedProjects.length) * 100) : 0;

  res.status(200).json({
    status: 'success',
    data: {
      projectsJoined: joinedProjects.length,
      tasksCompleted: completedTasksCount,
      hoursContributed: user.stats.hoursContributed,
      projectsCompleted,
      volunteerPoints: user.volunteerPoints,
      badges: user.badges,
      charts: {
        taskCompletionRate,
        projectCompletionRate,
      },
      recentProjects: joinedProjects.slice(0, 5),
    },
  });
});

// @route GET /api/v1/dashboard/manager
exports.getManagerDashboard = catchAsync(async (req, res, next) => {
  const managerId = req.user._id;

  const projects = await Project.find({ projectManager: managerId });
  const projectIds = projects.map((p) => p._id);

  const [pendingApplications, completedTasks] = await Promise.all([
    Application.countDocuments({ project: { $in: projectIds }, status: 'pending' }),
    Task.countDocuments({ project: { $in: projectIds }, status: 'COMPLETED' }),
  ]);

  const totalVolunteers = projects.reduce((sum, p) => sum + p.currentVolunteersCount, 0);
  const activeProjects = projects.filter((p) => ['active', 'in_progress'].includes(p.status)).length;

  res.status(200).json({
    status: 'success',
    data: {
      totalProjects: projects.length,
      activeProjects,
      totalVolunteers,
      pendingApplications,
      completedTasks,
      projectProgress: projects.map((p) => ({
        id: p._id,
        title: p.title,
        completionPercentage: p.completionPercentage,
        impactScore: p.impactScore,
      })),
    },
  });
});

// @route GET /api/v1/dashboard/admin
exports.getAdminDashboard = catchAsync(async (req, res, next) => {
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
      totalProjects,
      activeProjects: statusMap.active + statusMap.in_progress,
      completedProjects: statusMap.completed,
      totalVolunteers: totalVolunteersAgg[0]?.total || 0,
      pendingProjects: statusMap.pending_approval,
      charts: {
        usersByRole: roleMap,
        projectsByCategory: projectsByCategory.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
      },
    },
  });
});

// @route GET /api/v1/dashboard/leaderboard/impact  (top projects by impact score)
exports.getImpactLeaderboard = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const projects = await Project.find({ status: 'completed' })
    .sort('-impactScore')
    .limit(limit)
    .select('title category impactScore averageRating currentVolunteersCount completedTasks');

  res.status(200).json({ status: 'success', results: projects.length, data: { leaderboard: projects } });
});
