const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  category: String,
});

module.exports = mongoose.model("FAQ", faqSchema);
