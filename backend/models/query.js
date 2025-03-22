// models/query.js
const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true
  },
  userId: {
    type: String, // Change from ObjectId to String to match your frontend
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'general'
  },
  department: {
    type: String,
    default: 'general'
  },
  isVoiceCommand: {
    type: Boolean,
    default: false
  },
  responseType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'audio', 'pending', 'error'],
    default: 'pending'
  },
  response: {
    type: String,
    required: true,
    default: 'Processing...'
  },
  responseTime: {
    type: Date
  },
  queryTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Query', querySchema);