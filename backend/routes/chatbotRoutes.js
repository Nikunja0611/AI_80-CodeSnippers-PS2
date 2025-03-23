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

// Helper function to generate chart data
const generateChartData = (data, chartType) => {
  try {
    // Implementation depends on your data structure
    // This is a simple example
    if (!data || !Array.isArray(data)) {
      return null;
    }

    switch (chartType) {
      case 'bar':
        return {
          type: 'bar',
          labels: data.map(item => item.label || item.name || item.id),
          datasets: [{
            data: data.map(item => item.value || item.count || 0)
          }]
        };
      case 'line':
        return {
          type: 'line',
          labels: data.map(item => item.date || item.period || item.label),
          datasets: [{
            data: data.map(item => item.value || item.count || 0)
          }]
        };
      case 'pie':
        return {
          type: 'pie',
          labels: data.map(item => item.label || item.name || item.category),
          datasets: [{
            data: data.map(item => item.value || item.count || item.percentage || 0)
          }]
        };
      default:
        return null;
    }
  } catch (error) {
    console.error('Error generating chart data:', error);
    return null;
  }
};

// Function to format response based on platform
const formatResponseForPlatform = (response, platform, chartInfo) => {
  try {
    switch (platform.toLowerCase()) {
      case 'web':
        // For web, we can return rich HTML with possible chart embedding
        if (chartInfo) {
          return {
            text: response,
            chart: chartInfo
          };
        }
        return { text: response };
        
      case 'mobile':
        // For mobile apps, we might need a more structured format
        const formattedMobile = {
          text: response,
          format: 'markdown'
        };
        if (chartInfo) {
          formattedMobile.chart = chartInfo;
        }
        return formattedMobile;
        
      case 'slack':
        // For Slack, we might need to format as blocks
        const slackBlocks = [{ type: 'section', text: { type: 'mrkdwn', text: response } }];
        if (chartInfo) {
          slackBlocks.push({
            type: 'image',
            image_url: chartInfo.url,
            alt_text: `${chartInfo.type} chart`
          });
        }
        return { blocks: slackBlocks };
        
      case 'teams':
        // For MS Teams
        const teamsCard = {
          type: 'AdaptiveCard',
          body: [{ type: 'TextBlock', text: response, wrap: true }]
        };
        if (chartInfo) {
          teamsCard.body.push({
            type: 'Image', 
            url: chartInfo.url,
            altText: `${chartInfo.type} chart`
          });
        }
        return teamsCard;
        
      default:
        // Default to simple text response
        return { text: response };
    }
  } catch (error) {
    console.error('Error formatting response:', error);
    return { text: response }; // Fallback to simple text
  }
};

// Process user query - updated to use our custom auth middleware
router.post('/query', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, department, isVoiceCommand, platform = 'web' } = req.body;
    
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
      
      // Format response for platform
      const formattedResponse = formatResponseForPlatform(
        faqMatch.faq.answer,
        platform,
        null
      );
      
      return res.json({ 
        success: true, 
        queryId: query._id,
        response: formattedResponse,
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
    
    // Detect if query requests visualization
    const visualizationPattern = /chart|graph|plot|visualize|trend/i;
    const needsVisualization = visualizationPattern.test(prompt);
    
    // If we got data from ERP, format and return it
    if (erpData && erpData.success) {
      // Format ERP data as a response
      let erpResponse = `Here's the information from the ${intent} system: 
      
${JSON.stringify(erpData.data, null, 2)}`;
      
      // If we need visualization and have ERP data
      let chartData = null;
      if (needsVisualization) {
        // Determine chart type
        let chartType = 'bar'; // default
        if (/trend|over time|history/i.test(prompt)) chartType = 'line';
        if (/distribution|breakdown|percentage/i.test(prompt)) chartType = 'pie';
        
        // Generate chart
        chartData = generateChartData(erpData.data, chartType);
        
        // Include in response
        if (chartData) {
          query.visualizationType = chartType;
          query.chartData = chartData;
          
          // Update response to include reference to chart
          erpResponse = `${erpResponse}\n\nI've generated a ${chartType} chart with the requested data.`;
        }
      }
      
      query.response = erpResponse;
      query.responseType = needsVisualization && chartData ? 'visualization' : 'text';
      query.responseTime = new Date();
      query.source = 'erp';
      query.processingTime = Date.now() - startTime;
      await query.save();
      
      // Format response for platform
      const formattedResponse = formatResponseForPlatform(
        erpResponse,
        platform,
        query.chartData ? {
          type: query.visualizationType,
          url: `/api/charts/${query._id}`
        } : null
      );
      
      return res.json({
        success: true,
        queryId: query._id,
        response: formattedResponse,
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
    
    // Format response for platform
    const formattedResponse = formatResponseForPlatform(
      response,
      platform,
      query.chartData ? {
        type: query.visualizationType,
        url: `/api/charts/${query._id}`
      } : null
    );
    
    // Send platform-specific response
    res.json({
      success: true,
      queryId: query._id,
      response: formattedResponse,
      source: query.source
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

// Text-to-speech endpoint for a specific query
router.get('/tts/:queryId', authMiddleware, async (req, res) => {
  try {
    const { queryId } = req.params;
    const query = await Query.findById(queryId);
    
    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }
    
    // Using Google Cloud TTS (mock implementation)
    const ttsResponse = {
      audioContent: "base64-encoded-audio"
    };
    
    res.json({
      success: true,
      audioUrl: `/api/audio/${queryId}`,
      duration: 12 // seconds
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

// Training feedback endpoint for admin users
router.post('/training-feedback', authMiddleware, async (req, res) => {
  try {
    const { queryId, correctResponse, category } = req.body;
    
    // Verify admin permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Permission denied" });
    }
    
    const query = await Query.findById(queryId);
    
    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }
    
    // Add to training data
    const trainingEntry = {
      prompt: query.prompt,
      response: correctResponse || query.response,
      department: query.department,
      category: category || query.intentDetected,
      source: 'human_feedback'
    };
    
    // In production, save to a TrainingData model
    console.log("Added to training data:", trainingEntry);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding training data:", error);
    res.status(500).json({ error: "Failed to add training data" });
  }
});

// Test endpoint for health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AskNova chatbot API is running' });
});

module.exports = router;