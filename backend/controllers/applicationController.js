const Application = require('../models/Application');
const Project = require('../models/Project');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createNotification } = require('./notificationController');
const { sendApplicationStatusEmail } = require('../utils/emailService');
const { POINTS } = require('../utils/impactScore');

// @route POST /api/v1/applications  (student)
exports.applyToProject = catchAsync(async (req, res, next) => {
  const { projectId, message } = req.body;
  if (!projectId) return next(new AppError('projectId is required.', 400));

  const project = await Project.findById(projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  // Pending submissions are intentionally open during hackathon evaluation.
  if (!['active', 'in_progress', 'pending_approval'].includes(project.status)) {
    return next(new AppError('This project is not currently accepting applications.', 400));
  }

  const alreadyMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
  if (alreadyMember) return next(new AppError('You are already a member of this project.', 409));

  // The unique compound index also enforces this at the DB level
  const existing = await Application.findOne({ project: projectId, student: req.user._id });
  if (existing) {
    return next(new AppError('You have already applied to this project.', 409));
  }

  const approvedCount = await Application.countDocuments({ project: project._id, status: 'approved' });
  if (approvedCount >= project.requiredVolunteers) {
    return next(new AppError('This project has reached its required volunteer capacity.', 400));
  }

  let application;
  try {
    application = await Application.create({ project: projectId, student: req.user._id, message });
  } catch (err) {
    if (err.code === 11000) return next(new AppError('You have already applied to this project.', 409));
    throw err;
  }

  await createNotification({
    recipient: project.projectManager,
    sender: req.user._id,
    type: 'new_application',
    title: 'New Volunteer Application',
    message: `${req.user.name} applied to join "${project.title}".`,
    relatedProject: project._id,
  });

  res.status(201).json({ status: 'success', data: { application } });
});

// @route GET /api/v1/applications/mine  (student)
exports.getMyApplications = catchAsync(async (req, res, next) => {
  const applications = await Application.find({ student: req.user._id })
    .populate('project', 'title category status projectImage location')
    .sort('-createdAt');
  res.status(200).json({ status: 'success', results: applications.length, data: { applications } });
});

// @route GET /api/v1/applications/project/:projectId  (project_manager, owner)
exports.getProjectApplications = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view these applications.', 403));
  }

  const filter = { project: req.params.projectId };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'name email phone city skills profilePicture')
    .sort('-createdAt');

  res.status(200).json({ status: 'success', results: applications.length, data: { applications } });
});

// @route PATCH /api/v1/applications/:id/decision  (project_manager, owner) body: { decision: 'approved'|'rejected', reason }
exports.decideApplication = catchAsync(async (req, res, next) => {
  const { decision, reason } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return next(new AppError('Decision must be "approved" or "rejected".', 400));
  }

  const application = await Application.findById(req.params.id).populate('project').populate('student');
  if (!application) return next(new AppError('Application not found.', 404));

  const project = application.project;
  if (project.projectManager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to review this application.', 403));
  }

  const wasApproved = application.status === 'approved';
  const approvedCountBeforeDecision = await Application.countDocuments({ project: project._id, status: 'approved' });
  if (decision === 'approved' && !wasApproved && approvedCountBeforeDecision >= project.requiredVolunteers) {
    return next(new AppError('This project has already reached its required volunteer capacity.', 400));
  }

  application.status = decision;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  if (decision === 'rejected') application.rejectionReason = reason || '';
  await application.save();

  if (decision === 'approved') {
    const projectDoc = await Project.findById(project._id);
    const alreadyMember = projectDoc.members.some((member) => member.user.toString() === application.student._id.toString());
    if (!alreadyMember) projectDoc.members.push({ user: application.student._id });
    projectDoc.currentVolunteersCount = await Application.countDocuments({ project: project._id, status: 'approved' });
    await projectDoc.save({ validateBeforeSave: false });

    if (!wasApproved) await User.findByIdAndUpdate(application.student._id, {
      $inc: { volunteerPoints: POINTS.JOIN_PROJECT, 'stats.projectsJoined': 1 },
    });
  } else if (wasApproved) {
    const projectDoc = await Project.findById(project._id);
    projectDoc.members = projectDoc.members.filter((member) => member.user.toString() !== application.student._id.toString());
    projectDoc.currentVolunteersCount = await Application.countDocuments({ project: project._id, status: 'approved' });
    await projectDoc.save({ validateBeforeSave: false });
  }

  await createNotification({
    recipient: application.student._id,
    sender: req.user._id,
    type: decision === 'approved' ? 'application_approved' : 'application_rejected',
    title: `Application ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
    message: `Your application for "${project.title}" was ${decision}.`,
    relatedProject: project._id,
  });

  sendApplicationStatusEmail(application.student, project, decision).catch((err) =>
    console.error('Application status email failed:', err.message)
  );

  res.status(200).json({ status: 'success', data: application });
});
