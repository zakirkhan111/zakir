const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const restrictTo = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/student', restrictTo('student'), dashboardController.getStudentDashboard);
router.get('/manager', restrictTo('project_manager', 'admin'), dashboardController.getManagerDashboard);
router.get('/admin', restrictTo('admin'), dashboardController.getAdminDashboard);
router.get('/leaderboard/impact', dashboardController.getImpactLeaderboard);

module.exports = router;
