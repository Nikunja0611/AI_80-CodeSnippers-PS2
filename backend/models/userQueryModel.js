const mongoose = require("mongoose");

const userQuerySchema = new mongoose.Schema({
  query: String,
  user: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserQuery", userQuerySchema);
