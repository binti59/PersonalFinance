const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
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
    enum: ['income', 'expense']
  },
  icon: {
    type: String,
    default: 'category'
  },
  color: {
    type: String,
    default: '#1976d2'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
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
CategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
CategorySchema.index({ userId: 1 });
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
