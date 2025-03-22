// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Query = require('../models/query');
const User = require('../models/user');
const Session = require('../models/session');
const Feedback = require('../models/feedback');
const { getContextualInfo } = require('../utils/contextProvider');
const { matchFAQ } = require('../utils/faqMatcher');

// Initialize GeminiAI client
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message must be a non-empty string' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: message }
          ]
        }
      ]
    });

    const response = result.response.text();

    res.json({ response });

  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ error: 'Failed to process your request' });
  }
});


// Get or create user session
// Update getOrCreateUserSession function
const getOrCreateUserSession = async (userId, userInfo) => {
  // First try to find by userId
  let user = await User.findOne({ userId });
  
  if (!user) {
    // Also check if a user with this sessionId already exists
    user = await User.findOne({ sessionId: userId });
    
    if (!user) {
      // Create new user if not found by either userId or sessionId
      user = new User({
        userId,
        sessionId: userId,
        department: userInfo.department || 'general',
        // Add other required fields based on your schema
      });
      await user.save();
      
      // Create a new session
      const session = new Session({
        sessionId: userId,
        userId: user._id,
        // Add other required fields
      });
      await session.save();
    } else {
      // If found by sessionId but not userId, update the userId
      user.userId = userId;
      await user.save();
    }
  } else {
    // User exists, update last active time if needed
    // You might want to add code here to update user's last activity
  }
  
  return user;
};

// Process user query
// Modify your query creation in the /query endpoint
router.post('/query', async (req, res) => {
  try {
    const { prompt, userId, userRole, department, isVoiceCommand } = req.body;
    console.log('Query endpoint hit with body:', req.body);
    
    // Get or create user
    const user = await getOrCreateUserSession(userId, {
      department: department || 'general',
    });
    
    // Initialize with default empty response and type
    // This addresses the required fields issue
    const query = new Query({
      prompt,
      userId: userId, // Keep as string for now (we'll fix the schema later)
      sessionId: userId,
      userRole: userRole || 'general',
      department: department || 'general',
      isVoiceCommand: isVoiceCommand || false,
      responseType: 'pending', // Add default value for required field
      response: 'Processing...', // Add default value for required field
    });
    
    try {
      await query.save();
    } catch (saveError) {
      console.warn('Error saving query:', saveError);
      
      // If the error is related to userId type, let's try finding the user's MongoDB _id
      if (saveError.errors && saveError.errors.userId) {
        // If user was found earlier, use its _id instead of the string userId
        if (user && user._id) {
          query.userId = user._id; // This should be an ObjectId
          await query.save();
        } else {
          throw saveError; // Re-throw if we can't fix it
        }
      } else {
        throw saveError; // Re-throw other errors
      }
    }
    
    // Process the query with Gemini or other logic...
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    
    const response = result.response.text();
    
    // Update the query with the response
    query.response = response;
    query.responseType = 'text';
    query.responseTime = new Date();
    await query.save();
    
    // Send response to client
    res.json({ 
      success: true, 
      queryId: query._id,
      response 
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
router.post('/feedback', async (req, res) => {
  try {
    const { queryId, rating, comment } = req.body;
    
    if (!queryId || !rating) {
      return res.status(400).json({ error: "QueryId and rating are required" });
    }
    
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
      userId: query.userId,
      rating,
      comment,
      sentiment
    });
    
    await feedback.save();
    
    res.json({ success: true, feedbackId: feedback._id });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// End user session
router.post('/end-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: "SessionId is required" });
    }
    
    // Find active session
    const session = await Session.findOne({ sessionId, isActive: true });
    
    if (!session) {
      return res.status(404).json({ error: "Active session not found" });
    }
    
    // Update session end time and status
    session.endTime = new Date();
    session.isActive = false;
    await session.save();
    
    res.json({ success: true, sessionDuration: session.duration });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

router.post('/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

module.exports = router;