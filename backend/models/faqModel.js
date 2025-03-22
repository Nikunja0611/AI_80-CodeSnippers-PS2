const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  department: { type: String, default: 'general' },
  keywords: [{ type: String }],
  popularity: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Text index for search functionality
faqSchema.index({ question: 'text', keywords: 'text' });

module.exports = mongoose.model('FAQ', faqSchema);