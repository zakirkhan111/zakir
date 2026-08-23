const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');

const router = express.Router();

router.get('/leaderboard/contributors', userController.getLeaderboard);

router.use(protect);
router.patch('/profile', uploadProfilePicture, userController.updateProfile);
router.get('/me/stats', userController.getMyStats);
router.get('/:id', userController.getUserById);

module.exports = router;
