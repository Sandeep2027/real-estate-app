const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/send-signup-otp', authController.sendSignupOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/set-password', authController.setPassword);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;