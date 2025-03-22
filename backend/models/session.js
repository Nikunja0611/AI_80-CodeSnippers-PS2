// models/session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  queryCount: {
    type: Number,
    default: 0
  },
  deviceInfo: {
    type: String
  },
  browser: {
    type: String
  },
  ipAddress: {
    type: String
  },
  location: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveTime: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Calculate session duration before saving
sessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);