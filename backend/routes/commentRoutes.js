const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', commentController.createComment);
router.get('/project/:projectId', commentController.getProjectComments);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
