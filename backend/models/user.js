// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  department: {
    type: String,
    enum: ['general', 'sales', 'purchase', 'inventory', 'production', 'finance', 'gst', 'admin'],
    default: 'general'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'supervisor'],
    default: 'user'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  queryCount: {
    type: Number,
    default: 0
  },
  deviceInfo: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);