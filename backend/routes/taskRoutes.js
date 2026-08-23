const express = require('express');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const restrictTo = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('project_manager', 'admin'), taskController.createTask);
router.get('/mine', restrictTo('student'), taskController.getMyTasks);
router.get('/project/:projectId', taskController.getProjectTasks);
router.patch('/:id/status', taskController.updateTaskStatus);
router.patch('/:id', restrictTo('project_manager', 'admin'), taskController.updateTask);
router.delete('/:id', restrictTo('project_manager', 'admin'), taskController.deleteTask);

module.exports = router;
