const express = require('express');
const applicationController = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const restrictTo = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('student'), applicationController.applyToProject);
router.get('/mine', restrictTo('student'), applicationController.getMyApplications);
router.get('/project/:projectId', restrictTo('project_manager', 'admin'), applicationController.getProjectApplications);
router.patch('/:id/decision', restrictTo('project_manager', 'admin'), applicationController.decideApplication);

module.exports = router;
