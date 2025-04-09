const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BudgetSchema = new Schema({
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
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  categories: [{
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rollover: {
    type: Boolean,
    default: false
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 80
    }
  }
});

// Pre-save middleware to update the updatedAt field
BudgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
BudgetSchema.index({ userId: 1 });
BudgetSchema.index({ userId: 1, period: 1, startDate: 1 });

module.exports = mongoose.model('Budget', BudgetSchema);
