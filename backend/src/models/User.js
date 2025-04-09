const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required unless user has social logins
      return this.socialLogins.length === 0;
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  socialLogins: [{
    provider: {
      type: String,
      enum: ['google', 'facebook']
    },
    providerId: {
      type: String
    },
    email: {
      type: String,
      lowercase: true
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Pre-save middleware to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'socialLogins.providerId': 1 });

module.exports = mongoose.model('User', UserSchema);
