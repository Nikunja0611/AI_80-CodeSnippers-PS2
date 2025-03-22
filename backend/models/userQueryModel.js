const mongoose = require("mongoose");

const userQuerySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    default: "general"
  },
  department: {
    type: String,
    enum: ["sales", "purchase", "stores", "production", "quality", "dispatch", "finance", "hr", "admin", "general"],
    default: "general"
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    default: ""
  },
  responseType: {
    type: String,
    enum: ["faq", "ai", "erp_data", "escalated", "none"],
    default: "none"
  },
  modulesReferenced: [String],
  timestamp: {
    type: Date,
    default: Date.now
  },
  sentiment: {
    type: Number,  // -1 to 1 scale, -1 being negative, 1 being positive
    default: 0
  },
  needsEscalation: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: String,
    default: ""
  },
  escalationResolved: {
    type: Boolean, 
    default: false
  },
  ticketId: {
    type: String,
    default: function() {
      return "TKT" + Date.now().toString().slice(-8);
    }
  },
  relevantFaqs: [{
    faqId: mongoose.Schema.Types.ObjectId,
    relevanceScore: Number
  }],
  feedback: {
    rating: {
      type: Number, // 1-5 rating
      default: 0
    },
    comments: String
  }
});

// Add text search indexing
userQuerySchema.index({ query: 'text' });

module.exports = mongoose.model("UserQuery", userQuerySchema);