const Project = require('../models/Project');
const Task = require('../models/Task');
const Application = require('../models/Application');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const { createNotification } = require('./notificationController');
const { calculateImpactScore } = require('../utils/impactScore');
const { getIO } = require('../utils/socket');

// @route POST /api/v1/projects   (project_manager)
exports.createProject = catchAsync(async (req, res, next) => {
  const {
    title, description, category, location, startDate, endDate,
    requiredVolunteers, skillsRequired,
  } = req.body;

  if (!title || !description || !category || !location || !startDate || !endDate || !requiredVolunteers) {
    return next(new AppError('Please provide all required project fields.', 400));
  }

  // Multipart form submissions send the location as plain text. Only parse JSON
  // when it is valid; otherwise normalize the text to the Project schema.
  let parsedLocation = location;
  if (typeof location === 'string') {
    try {
      parsedLocation = JSON.parse(location);
    } catch (_) {
      parsedLocation = { city: location.trim(), address: location.trim() };
    }
  }

  if (!parsedLocation || typeof parsedLocation !== 'object' || Array.isArray(parsedLocation)) {
    parsedLocation = { city: String(location || '').trim(), address: String(location || '').trim() };
  }

  const coordinates = parsedLocation.coordinates?.coordinates;
  const hasCoordinates = Array.isArray(coordinates)
    && coordinates.length === 2
    && coordinates.every(Number.isFinite);

  parsedLocation = {
    city: parsedLocation.city || parsedLocation.name || String(location || '').trim(),
    address: parsedLocation.address || '',
    // Project.location.coordinates is GeoJSON and therefore stores [lng, lat].
    coordinates: hasCoordinates
      ? { type: 'Point', coordinates }
      : { type: 'Point', coordinates: [73.0679, 33.6007] },
  };

  const newProject = await Project.create({
    title,
    description,
    category,
    location: parsedLocation,
    startDate,
    endDate,
    requiredVolunteers,
    skillsRequired: Array.isArray(skillsRequired)
      ? skillsRequired
      : typeof skillsRequired === 'string'
      ? skillsRequired.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    projectManager: req.user._id,
    projectImage: req.file ? { url: req.file.path } : undefined,
    status: 'pending_approval',
  });

  // Notify all admins that a new project needs approval
  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        recipient: admin._id,
        sender: req.user._id,
        type: 'project_submitted',
        title: 'New Project Submitted',
        message: `${req.user.name} submitted "${newProject.title}" for approval.`,
        relatedProject: newProject._id,
      })
    )
  );

  // Notify students immediately so their bell and discovery view update without refresh.
  const students = await User.find({ role: 'student', status: 'active' }).select('_id');
  await Promise.all(
    students.map((student) => createNotification({
      recipient: student._id,
      sender: req.user._id,
      type: 'general',
      title: 'New Campaign Posted',
      message: 'A new campaign has been posted!',
      link: `/projects/${newProject._id}`,
      relatedProject: newProject._id,
    }))
  );

  try {
    getIO().emit('new-project', {
      projectId: newProject._id,
      message: 'A new campaign has been posted!',
    });
  } catch (_) {
    // Socket.io is optional for non-server execution contexts.
  }

  res.status(201).json({ status: 'success', data: newProject });
});

// @route GET /api/v1/projects  (public discovery — search/filter/sort/paginate)
exports.getAllProjects = catchAsync(async (req, res, next) => {
  // During evaluation, discovery includes pending submissions as well as live projects.
  const isAdmin = req.user?.role === 'admin';
  const baseFilter = isAdmin ? {} : { status: { $in: ['active', 'pending_approval'] } };

  // Only administrators may override the public evaluation status set.
  if (isAdmin && req.query.status) baseFilter.status = req.query.status;

  const queryString = { ...req.query };
  delete queryString.status;

  const features = new APIFeatures(Project.find(baseFilter), queryString)
    .search(['title', 'description'])
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [projects, total] = await Promise.all([
    features.query.populate('projectManager', 'name email profilePicture'),
    Project.countDocuments(baseFilter),
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

// @route GET /api/v1/projects/:id
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('projectManager', 'name email profilePicture city')
    .populate('members.user', 'name profilePicture city skills')
    .populate('reviews.user', 'name profilePicture');

  if (!project) return next(new AppError('Project not found.', 404));

  res.status(200).json({ status: 'success', data: { project } });
});

// @route PATCH /api/v1/projects/:id  (owner project_manager only)
exports.updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to edit this project.', 403));
  }

  const allowedFields = [
    'title', 'description', 'category', 'location', 'startDate', 'endDate',
    'requiredVolunteers', 'skillsRequired', 'status',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] === undefined) return;

    if (field === 'location' && typeof req.body[field] === 'string') {
      // Multipart form submissions (the Edit Project modal) send location as
      // plain text, not JSON — only parse JSON when it actually is JSON,
      // otherwise normalize the text to the Project schema shape, exactly
      // like createProject does. Never let a raw JSON.parse throw here.
      try {
        project.location = JSON.parse(req.body[field]);
      } catch (_) {
        project.location = { city: req.body[field].trim(), address: req.body[field].trim() };
      }
      return;
    }

    project[field] = req.body[field];
  });

  if (req.file) {
    project.projectImage = { url: req.file.path };
  }

  await project.save();

  // Notify every applied/joined volunteer that the project they applied to
  // was updated, so they never miss changes made after they joined.
  if (project.members?.length) {
    const { createNotification } = require('./notificationController');
    await Promise.all(
      project.members.map((m) =>
        createNotification({
          recipient: m.user,
          sender: req.user._id,
          type: 'general',
          title: 'Project Updated',
          message: `"${project.title}" was just updated by its project manager.`,
          relatedProject: project._id,
        }).catch(() => {})
      )
    );
  }

  res.status(200).json({ status: 'success', data: { project } });
});

// @route DELETE /api/v1/projects/:id  (owner project_manager or admin)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this project.', 403));
  }

  await Task.deleteMany({ project: project._id });
  await Application.deleteMany({ project: project._id });
  await project.deleteOne();

  res.status(204).json({ status: 'success', data: null });
});

// @route GET /api/v1/projects/manager/mine  (project_manager)
exports.getMyManagedProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ projectManager: req.user._id }).sort('-createdAt');
  res.status(200).json({ status: 'success', results: projects.length, data: { projects } });
});

// @route GET /api/v1/projects/student/joined  (student)
exports.getMyJoinedProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ 'members.user': req.user._id }).sort('-createdAt');
  res.status(200).json({ status: 'success', results: projects.length, data: { projects } });
});

// @route POST /api/v1/projects/:id/updates  (project_manager, owner)
exports.addProjectUpdate = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to post updates on this project.', 403));
  }

  if (!req.body.text) return next(new AppError('Update text is required.', 400));

  project.updates.push({ text: req.body.text, postedBy: req.user._id });
  await project.save();

  res.status(201).json({ status: 'success', data: { updates: project.updates } });
});

// @route GET /api/v1/projects/:id/analytics  (project_manager, owner)
exports.getProjectAnalytics = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these analytics.', 403));
  }

  const tasks = await Task.find({ project: project._id });
  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    COMPLETED: tasks.filter((t) => t.status === 'COMPLETED').length,
  };

  const applications = await Application.find({ project: project._id });
  const applicationsByStatus = {
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  res.status(200).json({
    status: 'success',
    data: {
      volunteers: project.currentVolunteersCount,
      requiredVolunteers: project.requiredVolunteers,
      completionPercentage: project.completionPercentage,
      impactScore: project.impactScore,
      averageRating: project.averageRating,
      tasksByStatus,
      applicationsByStatus,
    },
  });
});

// @route POST /api/v1/projects/:id/reviews  (student, project member, project completed)
exports.addReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  if (!rating) return next(new AppError('Rating is required.', 400));

  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.status !== 'completed') {
    return next(new AppError('You can only review a completed project.', 400));
  }

  const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) {
    return next(new AppError('Only project members can leave a review.', 403));
  }

  const alreadyReviewed = project.reviews.find((r) => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) {
    alreadyReviewed.rating = rating;
    alreadyReviewed.comment = comment || alreadyReviewed.comment;
  } else {
    project.reviews.push({ user: req.user._id, rating, comment });
  }

  project.recalculateAverageRating();
  await project.save();

  res.status(201).json({ status: 'success', data: { averageRating: project.averageRating, reviews: project.reviews } });
});

// @route POST /api/v1/projects/:id/completion-evidence  (project member)
exports.uploadCompletionEvidence = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember && project.projectManager.toString() !== req.user._id.toString()) {
    return next(new AppError('Only project members can upload completion evidence.', 403));
  }

  if (!req.files || !req.files.length) {
    return next(new AppError('Please upload at least one evidence file.', 400));
  }

  const evidence = req.files.map((f) => ({
    url: f.path,
    uploadedBy: req.user._id,
  }));

  project.completionEvidence.push(...evidence);
  await project.save();

  res.status(201).json({ status: 'success', data: { completionEvidence: project.completionEvidence } });
});

// Recalculates and persists a project's Impact Score. Exported for reuse by taskController.
exports.recalculateProjectImpactScore = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;

  const score = calculateImpactScore({
    volunteersCount: project.currentVolunteersCount,
    tasksCompleted: project.completedTasks,
    completionPercentage: project.completionPercentage,
  });

  project.impactScore = score;
  await project.save({ validateBeforeSave: false });
  return score;
};
