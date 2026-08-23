const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const restrictTo = require('../middleware/role');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/suspend', adminController.toggleSuspendUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/projects', adminController.getAllProjectsAdmin);
router.patch('/projects/:id/approve', adminController.approveProject);
router.patch('/projects/:id/reject', adminController.rejectProject);
router.delete('/projects/:id', adminController.removeProject);
router.post('/projects/:id/issue-certificates', adminController.issueCertificates);

router.get('/stats', adminController.getPlatformStats);
router.get('/reports', adminController.getReports);

module.exports = router;
