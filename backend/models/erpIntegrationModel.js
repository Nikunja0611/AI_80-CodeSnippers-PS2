const mongoose = require("mongoose");

const erpModuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  masterData: [{
    name: String,
    description: String,
    apiEndpoint: String,
    sampleQueries: [String]
  }],
  transactions: [{
    name: String,
    description: String,
    apiEndpoint: String,
    sampleQueries: [String]
  }],
  reports: [{
    name: String,
    description: String,
    apiEndpoint: String,
    sampleQueries: [String]
  }],
  dependencies: [String],
  contextPrompt: String
});

const erpGSTSchema = new mongoose.Schema({
  gstType: {
    type: String,
    enum: ["CGST", "SGST", "IGST", "UTGST"],
    required: true
  },
  description: String,
  applicableOn: String,
  collectedBy: String,
  sampleQueries: [String]
});

const erpIntegrationSchema = new mongoose.Schema({
  modules: [erpModuleSchema],
  gstTypes: [erpGSTSchema],
  systemContext: {
    type: String,
    default: "IDMS ERP System"
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ERPIntegration", erpIntegrationSchema);