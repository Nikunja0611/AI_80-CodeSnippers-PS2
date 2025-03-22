const express = require('express');
const router = express.Router();
const Query = require('../models/query');
const User = require('../models/user');
const Session = require('../models/session');
const Feedback = require('../models/feedback');
const { getContextualInfo, fetchERPData } = require('../utils/contextProvider');
const { matchFAQ } = require('../utils/faqMatcher');
const { createEnhancedPrompt, detectQueryIntent } = require('../utils/promptEnhancer');
const { authenticateUser } = require('../config/firebaseAdmin');

// Initialize Gemini AI client
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Modified authentication middleware to handle anonymous sessions
// Modified authentication middleware to handle anonymous sessions
const authMiddleware = async (req, res, next) => {
  try {
    // Check if auth token is provided
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Create anonymous session data
      req.user = {
        isAnonymous: true,
        firebaseUid: `anonymous-${Date.now()}`,
        email: `guest-${Date.now()}@asknova.local`,
        name: 'Guest User'
      };
      return next();
    }
    
    // Otherwise use the real authentication
    try {
      await authenticateUser(req, res, next);
      
      // Check if authenticateUser properly set req.user
      if (!req.user) {
        req.user = {
          isAnonymous: true,
          firebaseUid: `anonymous-${Date.now()}`,
          email: `guest-${Date.now()}@asknova.local`,
          name: 'Guest User'
        };
      }
      
      return next();
    } catch (authError) {
      // If authentication fails, fall back to anonymous
      console.warn('Authentication failed, using anonymous session:', authError.message);
      req.user = {
        isAnonymous: true,
        firebaseUid: `anonymous-${Date.now()}`,
        email: `guest-${Date.now()}@asknova.local`,
        name: 'Guest User'
      };
      return next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create or get user session - updated to handle anonymous users
const getOrCreateSession = async (req) => {
  try {
    const { firebaseUid, email, name, isAnonymous } = req.user;
    const sessionId = req.body.sessionId || `session_${Date.now()}`;
    const platform = req.body.platform || 'web';
    const deviceInfo = req.body.deviceInfo || {};

    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid });
    
    // Create user if doesn't exist
    if (!user) {
      user = new User({
        firebaseUid,
        email,
        displayName: name || email.split('@')[0],
        department: req.body.department || 'general',
        role: isAnonymous ? 'guest' : (req.body.role || 'employee'),
        isAnonymous: !!isAnonymous
      });
      await user.save();
    }
    
    // Update last active time
    user.lastActive = new Date();
    await user.save();
    
    // Find active session or create new one
    let session = await Session.findOne({ 
      userId: user._id,
      isActive: true
    });
    
    if (!session) {
      session = new Session({
        sessionId,
        userId: user._id,
        platform,
        deviceInfo,
        isAnonymous: !!isAnonymous
      });
      await session.save();
    }
    
    return { user, session };
  } catch (error) {
    console.error('Error in session management:', error);
    throw error;
  }
};

// Process user query - updated to use our custom auth middleware
router.post('/query', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, department, isVoiceCommand } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt must be a non-empty string' 
      });
    }
    
    // Get user session
    const { user, session } = await getOrCreateSession(req);
    
    // Detect intent
    const intent = await detectQueryIntent(prompt);
    
    // Create initial query record
    const query = new Query({
      sessionId: session.sessionId,
      userId: user._id,
      prompt,
      department: department || user.department,
      userRole: user.role,
      isVoiceCommand: isVoiceCommand || false,
      responseType: 'pending',
      response: 'Processing your request...',
      intentDetected: intent
    });
    
    await query.save();
    
    // First check if we have a direct FAQ match
    const faqMatch = await matchFAQ(prompt, user.department);
    
    // Add null check before accessing properties
    if (faqMatch && faqMatch.matched && faqMatch.confidence > 0.75) {
      // If we have a high confidence FAQ match, use that
      query.response = faqMatch.faq.answer;
      query.responseType = 'text';
      query.responseTime = new Date();
      query.source = 'faq';
      query.processingTime = Date.now() - startTime;
      await query.save();
      
      return res.json({ 
        success: true, 
        queryId: query._id,
        response: faqMatch.faq.answer,
        source: 'faq'
      });
    }
    
    // If intent is specific to ERP, try to fetch data
    let erpData = null;
    if (intent !== 'general') {
      // Extract parameters from prompt - simplified version
      // In production, use NLP to properly extract parameters
      const params = {};
      erpData = await fetchERPData(intent, params, user.role);
    }
    
    // If we got data from ERP, format and return it
    if (erpData && erpData.success) {
      // Format ERP data as a response
      const erpResponse = `Here's the information from the ${intent} system: 
      
${JSON.stringify(erpData.data, null, 2)}`;
      
      query.response = erpResponse;
      query.responseType = 'text';
      query.responseTime = new Date();
      query.source = 'erp';
      query.processingTime = Date.now() - startTime;
      await query.save();
      
      return res.json({
        success: true,
        queryId: query._id,
        response: erpResponse,
        source: 'erp',
        data: erpData.data
      });
    }
    
    // Otherwise, enhance the prompt with context and use Gemini
    const { enhancedPrompt, context } = await createEnhancedPrompt(
      prompt, 
      user._id, 
      user.department
    );
    
    // Store context info for future reference
    query.contextInfo = context;
    await query.save();
    
    // Process with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }]
    });
    
    const response = result.response.text();
    
    // Update the query with the response
    query.response = response;
    query.responseType = 'text';
    query.responseTime = new Date();
    query.source = 'ai';
    query.processingTime = Date.now() - startTime;
    await query.save();
    
    // Send response to client
    res.json({ 
      success: true, 
      queryId: query._id,
      response,
      source: 'ai'
    });
    
  } catch (error) {
    console.warn('Error processing query:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing query', 
      error: error.message 
    });
  }
});

// Update remaining endpoints to use our modified auth middleware

// Submit feedback for a query
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { queryId, rating, comment, category } = req.body;
    
    if (!queryId || !rating) {
      return res.status(400).json({ error: "QueryId and rating are required" });
    }
    
    const { user } = await getOrCreateSession(req);
    
    const query = await Query.findById(queryId);
    
    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }
    
    // Determine sentiment based on rating
    let sentiment = 'neutral';
    if (rating >= 4) sentiment = 'positive';
    if (rating <= 2) sentiment = 'negative';
    
    // Save feedback
    const feedback = new Feedback({
      queryId,
      userId: user._id,
      rating,
      comment,
      sentiment,
      category
    });
    
    await feedback.save();
    
    res.json({ success: true, feedbackId: feedback._id });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// End user session
router.post('/end-session', authMiddleware, async (req, res) => {
  try {
    const { user, session } = await getOrCreateSession(req);
    
    // Update session end time and status
    session.endTime = new Date();
    session.isActive = false;
    await session.save();
    
    res.json({ 
      success: true, 
      sessionDuration: session.duration 
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Get conversation history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { user } = await getOrCreateSession(req);
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    const queries = await Query.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Query.countDocuments({ userId: user._id });
    
    res.json({
      success: true,
      data: queries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch conversation history" });
  }
});

// Test endpoint for health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AskNova chatbot API is running' });
});

module.exports = router;