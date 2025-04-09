const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Configure passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ 'socialLogins.providerId': profile.id, 'socialLogins.provider': 'google' });
    
    if (user) {
      // Update last login
      const socialLoginIndex = user.socialLogins.findIndex(
        login => login.providerId === profile.id && login.provider === 'google'
      );
      
      if (socialLoginIndex !== -1) {
        user.socialLogins[socialLoginIndex].lastLogin = new Date();
        await user.save();
      }
      
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Add social login to existing user
      user.socialLogins.push({
        provider: 'google',
        providerId: profile.id,
        email: profile.emails[0].value,
        lastLogin: new Date()
      });
      
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    const newUser = new User({
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      isVerified: true,
      socialLogins: [{
        provider: 'google',
        providerId: profile.id,
        email: profile.emails[0].value,
        lastLogin: new Date()
      }],
      settings: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light'
      }
    });
    
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, false);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ 'socialLogins.providerId': profile.id, 'socialLogins.provider': 'facebook' });
    
    if (user) {
      // Update last login
      const socialLoginIndex = user.socialLogins.findIndex(
        login => login.providerId === profile.id && login.provider === 'facebook'
      );
      
      if (socialLoginIndex !== -1) {
        user.socialLogins[socialLoginIndex].lastLogin = new Date();
        await user.save();
      }
      
      return done(null, user);
    }
    
    // Check if user exists with same email
    if (profile.emails && profile.emails.length > 0) {
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Add social login to existing user
        user.socialLogins.push({
          provider: 'facebook',
          providerId: profile.id,
          email: profile.emails[0].value,
          lastLogin: new Date()
        });
        
        await user.save();
        return done(null, user);
      }
    }
    
    // Create new user
    const newUser = new User({
      email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      isVerified: true,
      socialLogins: [{
        provider: 'facebook',
        providerId: profile.id,
        email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
        lastLogin: new Date()
      }],
      settings: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light'
      }
    });
    
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, false);
  }
}));

// JWT middleware
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization token required' });
  }
};

// Routes
// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isVerified: false,
      verificationToken,
      settings: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light'
      }
    });
    
    await newUser.save();
    
    // TODO: Send verification email
    
    res.status(201).json({ 
      message: 'User registered successfully. Please verify your email.' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    return res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        settings: user.settings
      }
    });
  })(req, res, next);
});

// Google OAuth routes
app.get('/api/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/social?token=${token}`);
  }
);

// Facebook OAuth routes
app.get('/api/auth/facebook', passport.authenticate('facebook', { 
  scope: ['email'] 
}));

app.get('/api/auth/facebook/callback', 
  passport.authenticate('facebook', { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/social?token=${token}`);
  }
);

// Verify email
app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }
    
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // TODO: Send reset password email
    
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Protected route example
app.get('/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

module.exports = app;
