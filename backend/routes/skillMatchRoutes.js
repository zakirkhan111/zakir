const express = require('express');
const skillMatchController = require('../controllers/skillMatchController');
const { protect } = require('../middleware/auth');
const restrictTo = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', restrictTo('student'), skillMatchController.matchMeToProject);
router.get('/recommended-projects', restrictTo('student'), skillMatchController.getRecommendedProjects);
router.get('/project/:projectId/candidates', restrictTo('project_manager', 'admin'), skillMatchController.getBestCandidatesForProject);

module.exports = router;
