// models/faq.js
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['sales', 'purchase', 'inventory', 'production', 'gst', 'general']
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

module.exports = mongoose.model('FAQ', faqSchema);