const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Query = require('../models/query');
const Feedback = require('../models/feedback');
const FAQ = require('../models/faqModel');
const ERPIntegration = require('../models/erpIntegrationModel');
const { authenticateUser, admin } = require('../config/firebaseAdmin');

// Middleware to check admin permissions
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges',
      error: error.message
    });
  }
};

// CRUD operations for FAQs

// Create FAQ
router.post('/faq', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { question, answer, category, department, keywords } = req.body;
    
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    const faq = new FAQ({
      question,
      answer,
      category,
      department: department || 'general',
      keywords: keywords || [],
      createdBy: user._id
    });
    
    await faq.save();
    
    res.status(201).json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating FAQ',
      error: error.message
    });
  }
});

// Get all FAQs
router.get('/faq', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { department, category, active } = req.query;
    
    const filter = {};
    
    if (department) filter.department = department;
    if (category) filter.category = category;
    if (active) filter.isActive = active === 'true';
    
    const faqs = await FAQ.find(filter).sort({ popularity: -1 });
    
    res.json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQs',
      error: error.message
    });
  }
});

// Update FAQ
router.put('/faq/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, department, keywords, isActive } = req.body;
    
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    // Update fields
    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (department) faq.department = department;
    if (keywords) faq.keywords = keywords;
    if (isActive !== undefined) faq.isActive = isActive;
    
    faq.lastUpdated = Date.now();
    
    await faq.save();
    
    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating FAQ',
      error: error.message
    });
  }
});

// Delete FAQ
router.delete('/faq/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    await FAQ.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting FAQ',
      error: error.message
    });
  }
});

// CRUD operations for ERP Integrations

// Create ERP Integration
router.post('/erp-integration', authenticateUser, isAdmin, async (req, res) => {
  try {
    const {
      module,
      name,
      endpoint,
      description,
      method,
      parameters,
      sampleResponse,
      responseMapping,
      accessRoles
    } = req.body;
    
    const integration = new ERPIntegration({
      module,
      name,
      endpoint,
      description,
      method: method || 'GET',
      parameters: parameters || [],
      sampleResponse: sampleResponse || {},
      responseMapping: responseMapping || {},
      accessRoles: accessRoles || ['all']
    });
    
    await integration.save();
    
    res.status(201).json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('Error creating ERP integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ERP integration',
      error: error.message
    });
  }
});

// Get all ERP Integrations
router.get('/erp-integration', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { module, active } = req.query;
    
    const filter = {};
    
    if (module) filter.module = module;
    if (active) filter.isActive = active === 'true';
    
    const integrations = await ERPIntegration.find(filter);
    
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

// Update ERP Integration
router.put('/erp-integration/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const integration = await ERPIntegration.findById(id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'ERP integration not found'
      });
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        integration[key] = updateData[key];
      }
    });
    
    await integration.save();
    
    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    console.error('Error updating ERP integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ERP integration',
      error: error.message
    });
  }
});

// Delete ERP Integration
router.delete('/erp-integration/:id', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await ERPIntegration.findById(id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'ERP integration not found'
      });
    }
    
    await ERPIntegration.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'ERP integration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ERP integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ERP integration',
      error: error.message
    });
  }
});

// Analytics endpoints

// Get usage statistics
router.get('/analytics/usage', authenticateUser, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (department) filter.department = department;
    
    // Total queries
    const totalQueries = await Query.countDocuments(filter);
    
    // Queries by source
    const queryBySource = await Query.aggregate([
      { $match: filter },
      { $group: {
        _id: '$source',
        count: { $sum: 1 }
      }}
    ]);
    
    // Average processing time
    const avgProcessingTime = await Query.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        avg: { $avg: '$processingTime' }
      }}
    ]);
    
    // Most common intents
    const topIntents = await Query.aggregate([
      { $match: filter },
      { $group: {
        _id: '$intentDetected',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // User sentiment from feedback
    const sentiment = await Feedback.aggregate([
      { $match: filter },
      { $group: {
        _id: '$sentiment',
        count: { $sum: 1 }
      }}
    ]);
    
    res.json({
      success: true,
      data: {
        totalQueries,
        queryBySource,
        avgProcessingTime: avgProcessingTime[0]?.avg || 0,
        topIntents,
        sentiment
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;