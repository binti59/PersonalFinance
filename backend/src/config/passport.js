const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Configure passport
const configurePassport = () => {
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

  // Serialize and deserialize user
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
};

module.exports = configurePassport;
