const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GoalSchema = new Schema({
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
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['retirement', 'house', 'education', 'vacation', 'emergency', 'car', 'debt', 'other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  accounts: [{
    type: Schema.Types.ObjectId,
    ref: 'Account'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  icon: {
    type: String,
    default: 'flag'
  }
});

// Pre-save middleware to update the updatedAt field
GoalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
GoalSchema.index({ userId: 1 });
GoalSchema.index({ targetDate: 1 });

module.exports = mongoose.model('Goal', GoalSchema);
