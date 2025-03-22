const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true  // This is causing the problem when null values are inserted
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
  isActive: { 
    type: Boolean, 
    default: true 
  },
  platform: { 
    type: String, 
    enum: ['web', 'whatsapp', 'slack', 'teams', 'email'], 
    default: 'web' 
  },
  deviceInfo: { 
    type: Object, 
    default: {} 
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  if (!this.endTime) return null;
  return (this.endTime - this.startTime) / 1000; // Duration in seconds
});

module.exports = mongoose.model('Session', sessionSchema);