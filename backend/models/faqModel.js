const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  answer: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: ["sales", "purchase", "stores", "production", "quality", "dispatch", "finance", "gst", "general"],
    default: "general"
  },
  tags: [String],
  category: {
    type: String,
    enum: ["master_data", "transaction", "report", "process", "general"],
    default: "general"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  useCount: {
    type: Number,
    default: 0
  },
  relevanceScore: {
    type: Number,
    default: 1.0
  }
});

// Add text search indexing
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

// Pre-save middleware to update timestamp
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("FAQ", faqSchema);