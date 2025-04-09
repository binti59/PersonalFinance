const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['budget', 'goal', 'bill', 'account', 'system']
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  relatedId: {
    type: Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['Budget', 'Goal', 'Transaction', 'Account', 'Connection']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  action: {
    type: String
  }
});

// Create indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
