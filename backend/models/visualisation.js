const mongoose = require('mongoose');

const visualizationSchema = new mongoose.Schema({
  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Query',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chartType: {
    type: String,
    enum: ['bar', 'line', 'pie', 'scatter', 'radar', 'polar'],
    required: true
  },
  chartData: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Charts expire after 7 days by default
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  }
});

module.exports = mongoose.model('Visualization', visualizationSchema);