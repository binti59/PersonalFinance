const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
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
    enum: ['income', 'expense', 'netWorth', 'cashFlow', 'budget', 'category', 'goal']
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  filters: {
    type: Schema.Types.Mixed
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastGenerated: {
    type: Date,
    default: Date.now
  },
  data: {
    type: Schema.Types.Mixed
  }
});

// Create indexes
ReportSchema.index({ userId: 1 });
ReportSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Report', ReportSchema);
