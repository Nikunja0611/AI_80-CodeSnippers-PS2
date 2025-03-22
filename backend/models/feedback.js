const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  queryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Query', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  sentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  resolved: { type: Boolean, default: true },
  category: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);