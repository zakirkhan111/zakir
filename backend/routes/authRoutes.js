const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');

const router = express.Router();

router.post('/register', uploadProfilePicture, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.use(protect); // everything below requires authentication
router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);

module.exports = router;
