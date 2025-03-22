const User = require('../models/user');
const Query = require('../models/query');
const ERPIntegration = require('../models/erpIntegrationModel');
const axios = require('axios');

/**
 * Get contextual information for enhancing AI responses
 */
const getContextualInfo = async (userId, department = 'general') => {
  try {
    // Get user information
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        user: { department, role: 'employee' },
        conversationHistory: [],
        availableERP: []
      };
    }
    
    // Get recent queries from this user (last 5)
    const recentQueries = await Query.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('prompt response');
    
    // Get department-specific ERP integrations
    const erpModules = await ERPIntegration.find({ 
      $or: [
        { module: department },
        { module: 'general' }
      ],
      isActive: true,
      accessRoles: { $in: [user.role, 'all'] }
    });
    
    // Build context object
    const context = {
      user: {
        department: user.department || department,
        role: user.role || 'employee',
        name: user.displayName
      },
      conversationHistory: recentQueries.map(q => ({
        query: q.prompt,
        response: q.response
      })),
      availableERP: erpModules.map(m => ({
        module: m.module,
        name: m.name,
        description: m.description
      }))
    };
    
    return context;
  } catch (error) {
    console.error('Error gathering context:', error);
    return {
      user: { department, role: 'employee' },
      conversationHistory: [],
      availableERP: []
    };
  }
};

/**
 * Fetch real-time data from ERP system based on query intent
 */
const fetchERPData = async (intent, parameters, userRole) => {
  try {
    // Find appropriate ERP integration
    const erpIntegration = await ERPIntegration.findOne({
      module: intent,
      isActive: true,
      accessRoles: { $in: [userRole, 'all'] }
    });
    
    if (!erpIntegration) {
      return { 
        success: false, 
        message: 'No ERP integration available for this request' 
      };
    }
    
    // Make API call to ERP system
    const response = await axios({
      method: erpIntegration.method,
      url: `${process.env.ERP_API_BASE_URL}${erpIntegration.endpoint}`,
      headers: {
        'Authorization': `Bearer ${process.env.ERP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: erpIntegration.method === 'GET' ? parameters : undefined,
      data: erpIntegration.method !== 'GET' ? parameters : undefined
    });
    
    return {
      success: true,
      data: response.data,
      mapping: erpIntegration.responseMapping
    };
  } catch (error) {
    console.error('Error fetching ERP data:', error);
    return { 
      success: false, 
      message: 'Failed to fetch data from ERP system',
      error: error.message
    };
  }
};

module.exports = {
  getContextualInfo,
  fetchERPData
};