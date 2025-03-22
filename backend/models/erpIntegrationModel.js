const mongoose = require('mongoose');

const erpIntegrationSchema = new mongoose.Schema({
  module: { 
    type: String, 
    required: true,
    enum: ['sales', 'hr', 'finance', 'inventory', 'production', 'general'] 
  },
  name: { type: String, required: true },
  endpoint: { type: String, required: true },
  description: { type: String },
  method: { 
    type: String, 
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
    default: 'GET'
  },
  parameters: [{ 
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String },
    required: { type: Boolean, default: false }
  }],
  sampleResponse: { type: Object },
  responseMapping: { type: Object, default: {} },
  isActive: { type: Boolean, default: true },
  accessRoles: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('ERPIntegration', erpIntegrationSchema);