const express = require('express');
const router = express.Router();
const passport = require('passport');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  verifyEmail, 
  forgotPassword, 
  resetPassword,
  socialLogin
} = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Get user profile
// @access  Private
router.get('/me', authenticateJWT, getUserProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateJWT, updateUserProfile);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authenticateJWT, changePassword);

// @route   GET /api/auth/verify/:token
// @desc    Verify email
// @access  Public
router.get('/verify/:token', verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', resetPassword);

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  socialLogin
);

// @route   GET /api/auth/facebook
// @desc    Facebook OAuth login
// @access  Public
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email'] 
}));

// @route   GET /api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get('/facebook/callback', 
  passport.authenticate('facebook', { session: false }),
  socialLogin
);

// @route   POST /api/auth/social-login
// @desc    Handle social login from frontend
// @access  Public
router.post('/social-login', 
  (req, res, next) => {
    const { provider, token } = req.body;
    // This would be implemented to verify the token with the provider
    // and then find or create a user
    // For now, we'll just return a 501 Not Implemented
    res.status(501).json({ message: 'Social login API not fully implemented' });
  }
);

module.exports = router;
