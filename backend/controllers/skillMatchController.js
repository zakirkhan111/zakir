const Project = require('../models/Project');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Normalizes a skill string for fuzzy, case/whitespace-insensitive comparison
const normalize = (s) => s.toLowerCase().trim().replace(/[-_]/g, ' ');

/**
 * Computes an AI-style skill match score between a user's skills and a project's required skills.
 * Uses normalized exact/substring matching (a lightweight, explainable stand-in for an ML matcher —
 * easy to later swap for an embeddings-based cosine-similarity model without changing the API contract).
 */
function computeSkillMatch(userSkills = [], requiredSkills = []) {
  if (!requiredSkills.length) {
    return { score: 100, matchedSkills: [], missingSkills: [], extraSkills: userSkills };
  }

  const normalizedUserSkills = userSkills.map(normalize);
  const normalizedRequired = requiredSkills.map(normalize);

  const matchedSkills = [];
  const missingSkills = [];

  normalizedRequired.forEach((reqSkill, idx) => {
    const isMatch = normalizedUserSkills.some(
      (userSkill) => userSkill === reqSkill || userSkill.includes(reqSkill) || reqSkill.includes(userSkill)
    );
    if (isMatch) {
      matchedSkills.push(requiredSkills[idx]);
    } else {
      missingSkills.push(requiredSkills[idx]);
    }
  });

  const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  const extraSkills = userSkills.filter(
    (skill) => !normalizedRequired.some((reqSkill) => normalize(skill) === reqSkill || normalize(skill).includes(reqSkill))
  );

  return { score, matchedSkills, missingSkills, extraSkills };
}

// @route GET /api/v1/skill-match/project/:projectId  (student — how well do I match this project?)
exports.matchMeToProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId).select('title skillsRequired');
  if (!project) return next(new AppError('Project not found.', 404));

  const result = computeSkillMatch(req.user.skills, project.skillsRequired);

  res.status(200).json({
    status: 'success',
    data: {
      project: { id: project._id, title: project.title },
      ...result,
      recommendation:
        result.score >= 70
          ? 'Great fit! You meet most of the required skills.'
          : result.score >= 40
          ? 'Partial fit — you may want to upskill in the missing areas.'
          : 'Low fit — consider projects that better match your current skill set.',
    },
  });
});

// @route GET /api/v1/skill-match/recommended-projects  (student — best-matching open projects)
exports.getRecommendedProjects = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  const projects = await Project.find({ status: { $in: ['active', 'in_progress'] } })
    .select('title category location skillsRequired requiredVolunteers currentVolunteersCount projectImage endDate')
    .limit(200); // cap the candidate pool for performance, then rank in-memory

  const ranked = projects
    .map((project) => {
      const { score, matchedSkills, missingSkills } = computeSkillMatch(req.user.skills, project.skillsRequired);
      return { project, score, matchedSkills, missingSkills };
    })
    .filter((r) => r.score > 0 || !r.project.skillsRequired.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.status(200).json({ status: 'success', results: ranked.length, data: { recommendations: ranked } });
});

// @route GET /api/v1/skill-match/project/:projectId/candidates  (project_manager — best-matching applicants/students)
exports.getBestCandidatesForProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  if (project.projectManager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view candidate matches for this project.', 403));
  }

  const students = await User.find({ role: 'student', status: 'active' }).select('name email city skills profilePicture');

  const ranked = students
    .map((student) => {
      const { score, matchedSkills, missingSkills } = computeSkillMatch(student.skills, project.skillsRequired);
      return { student, score, matchedSkills, missingSkills };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.status(200).json({ status: 'success', results: ranked.length, data: { candidates: ranked } });
});

exports.computeSkillMatch = computeSkillMatch;
