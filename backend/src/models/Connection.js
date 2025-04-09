const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['truelayer', 'plaid', 'yodlee', 'other']
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  institutionId: {
    type: String
  },
  institutionName: {
    type: String
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'expired', 'revoked', 'error'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastSynced: {
    type: Date
  },
  consentId: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  }
});

// Pre-save middleware to update the updatedAt field
ConnectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
ConnectionSchema.index({ userId: 1 });
ConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });
ConnectionSchema.index({ accessToken: 1 });

module.exports = mongoose.model('Connection', ConnectionSchema);
