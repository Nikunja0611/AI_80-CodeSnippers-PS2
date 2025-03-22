const express = require('express');
const router = express.Router();
const ERPIntegration = require('../models/erpIntegrationModel');
const { authenticateUser } = require('../config/firebaseAdmin');
const axios = require('axios');

// Get available ERP integrations for user
router.get('/integrations', authenticateUser, async (req, res) => {
  try {
    const { department, role } = req.query;
    
    const filter = {
      isActive: true
    };
    
    if (department) {
      filter.$or = [
        { module: department },
        { module: 'general' }
      ];
    }
    
    if (role) {
      filter.accessRoles = { $in: [role, 'all'] };
    }
    
    const integrations = await ERPIntegration.find(filter)
      .select('module name description parameters');
    
    res.json({
      success: true,
      count: integrations.length,
      data: integrations
    });
  } catch (error) {
    console.error('Error fetching ERP integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ERP integrations',
      error: error.message
    });
  }
});

// Execute ERP query
router.post('/execute/:integrationId', authenticateUser, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const parameters = req.body.parameters || {};
    
    // Find integration
    const integration = await ERPIntegration.findById(integrationId);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'ERP integration not found'
      });
    }
    
    // Validate parameters
    const missingParams = integration.parameters
      .filter(param => param.required && !parameters[param.name])
      .map(param => param.name);
      
    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: ${missingParams.join(', ')}`
      });
    }
    
    // Execute ERP request
    const response = await axios({
      method: integration.method,
      url: `${process.env.ERP_API_BASE_URL}${integration.endpoint}`,
      headers: {
        'Authorization': `Bearer ${process.env.ERP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: integration.method === 'GET' ? parameters : undefined,
      data: integration.method !== 'GET' ? parameters : undefined
    });
    
    // Apply response mapping if available
    let formattedResponse = response.data;
    if (integration.responseMapping && Object.keys(integration.responseMapping).length > 0) {
      formattedResponse = mapResponse(response.data, integration.responseMapping);
    }
    
    res.json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    console.error('Error executing ERP integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing ERP integration',
      error: error.message
    });
  }
});

// Helper function to map response based on mapping configuration
function mapResponse(data, mapping) {
  if (!data || !mapping) return data;
  
  const result = {};
  
  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    let value = data;
    const path = sourcePath.split('.');
    
    for (const key of path) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }
    
    result[targetKey] = value;
  }
  
  return result;
}

module.exports = router;