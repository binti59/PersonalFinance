const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecurringTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastProcessed: {
    type: Date
  },
  nextOccurrence: {
    type: Date,
    required: true
  },
  dayOfMonth: {
    type: Number
  },
  dayOfWeek: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
RecurringTransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
RecurringTransactionSchema.index({ userId: 1 });
RecurringTransactionSchema.index({ nextOccurrence: 1 });
RecurringTransactionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);
