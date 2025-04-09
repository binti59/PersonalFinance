const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bank', 'credit', 'investment', 'loan', 'cash', 'other']
  },
  institution: {
    type: String,
    trim: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
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
  accountNumber: {
    type: String,
    trim: true
  },
  connectionId: {
    type: Schema.Types.ObjectId,
    ref: 'Connection'
  },
  metadata: {
    color: {
      type: String,
      default: '#1976d2'
    },
    icon: {
      type: String,
      default: 'account_balance'
    },
    order: {
      type: Number,
      default: 0
    }
  }
});

// Pre-save middleware to update the updatedAt field
AccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
AccountSchema.index({ userId: 1 });
AccountSchema.index({ userId: 1, type: 1 });
AccountSchema.index({ connectionId: 1 });

module.exports = mongoose.model('Account', AccountSchema);
