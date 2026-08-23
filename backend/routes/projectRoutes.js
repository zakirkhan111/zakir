const express = require('express');
const projectController = require('../controllers/projectController');
const { protect, optionalAuth } = require('../middleware/auth');
const restrictTo = require('../middleware/role');
const { uploadProjectImage, uploadCompletionEvidence } = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, projectController.getAllProjects);

router.use(protect);

router.get('/manager/mine', restrictTo('project_manager', 'admin'), projectController.getMyManagedProjects);
router.get('/student/joined', restrictTo('student'), projectController.getMyJoinedProjects);

router.post('/', restrictTo('project_manager'), uploadProjectImage, projectController.createProject);

router.get('/:id', projectController.getProject);
router.patch('/:id', restrictTo('project_manager', 'admin'), uploadProjectImage, projectController.updateProject);
router.delete('/:id', restrictTo('project_manager', 'admin'), projectController.deleteProject);

router.post('/:id/updates', restrictTo('project_manager'), projectController.addProjectUpdate);
router.get('/:id/analytics', restrictTo('project_manager', 'admin'), projectController.getProjectAnalytics);
router.post('/:id/reviews', restrictTo('student'), projectController.addReview);
router.post('/:id/completion-evidence', uploadCompletionEvidence, projectController.uploadCompletionEvidence);

module.exports = router;
