const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
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
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'transfer']
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  merchant: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringId: {
    type: Schema.Types.ObjectId,
    ref: 'RecurringTransaction'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  externalId: {
    type: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }]
});

// Pre-save middleware to update the updatedAt field
TransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ accountId: 1 });
TransactionSchema.index({ date: 1 });
TransactionSchema.index({ userId: 1, date: 1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ externalId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
