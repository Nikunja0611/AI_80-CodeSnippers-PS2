const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  department: { type: String, default: 'general' },
  role: { type: String, default: 'employee' },
  lastActive: { type: Date, default: Date.now },
  // Add this line:
  sessionId: { type: String, index: { unique: true, sparse: true } },
  preferences: {
    language: { type: String, default: 'en' },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  },
  permissions: [{ type: String }]
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);