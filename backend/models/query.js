const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  responseType: { 
    type: String, 
    enum: ['text', 'link', 'file', 'error', 'escalated', 'pending'],
    required: true
  },
  responseTime: { type: Date },
  processingTime: { type: Number }, // time in milliseconds
  contextInfo: { type: Object, default: {} },
  intentDetected: { type: String },
  department: { type: String, default: 'general' },
  userRole: { type: String, default: 'employee' },
  isVoiceCommand: { type: Boolean, default: false },
  isEscalated: { type: Boolean, default: false },
  escalationNote: { type: String },
  escalatedTo: { type: String },
  tags: [{ type: String }],
  source: { 
    type: String, 
    enum: ['ai', 'faq', 'erp', 'human'],
    default: 'ai'
  }
}, { timestamps: true });

// Index for improved query performance
querySchema.index({ sessionId: 1, createdAt: 1 });
querySchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('Query', querySchema);