// First, install the Firebase Admin SDK
// npm install firebase-admin

// Create a new file: config/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey'); // You need to download this from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-app.firebaseio.com"
});

module.exports = admin;

// Now update your routes/chatRoutes.js to include authentication middleware
const express = require('express');
const router = express.Router();
const Query = require('../models/query');
const User = require('../models/user');
const Session = require('../models/session');
const Feedback = require('../models/feedback');
const { getContextualInfo } = require('../utils/contextProvider');
const { matchFAQ } = require('../utils/faqMatcher');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Public test route
router.post('/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Protected routes
router.post('/chat', authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.uid; // Get user ID from authenticated token

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

    res.json({ response, userId });

  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

// Update getOrCreateUserSession to use Firebase user ID
const getOrCreateUserSession = async (firebaseUid, userInfo) => {
  // First try to find by Firebase UID
  let user = await User.findOne({ firebaseUid });
  
  if (!user) {
    // Create new user if not found
    user = new User({
      userId: firebaseUid, // Keep for backward compatibility
      firebaseUid: firebaseUid,
      sessionId: firebaseUid,
      department: userInfo.department || 'general',
      // Add other required fields based on your schema
    });
    await user.save();
    
    // Create a new session
    const session = new Session({
      sessionId: firebaseUid,
      userId: user._id,
      // Add other required fields
    });
    await session.save();
  } else {
    // User exists, update last active time
    user.lastActive = new Date();
    await user.save();
  }
  
  return user;
};

// Update query endpoint to use authentication
router.post('/query', authenticateUser, async (req, res) => {
  try {
    const { prompt, department, isVoiceCommand } = req.body;
    const userId = req.user.uid; // Get Firebase UID from token
    
    // Get or create user
    const user = await getOrCreateUserSession(userId, {
      department: department || 'general',
    });
    
    // Initialize with default empty response and type
    const query = new Query({
      prompt,
      userId: user._id, // Use MongoDB document ID
      firebaseUid: userId, // Store Firebase UID
      sessionId: userId,
      userRole: user.role || 'general',
      department: department || 'general',
      isVoiceCommand: isVoiceCommand || false,
      responseType: 'pending',
      response: 'Processing...',
    });
    
    await query.save();
    
    // Process the query with Gemini
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

// Update other routes to use authentication
router.post('/feedback', authenticateUser, async (req, res) => {
  try {
    const { queryId, rating, comment } = req.body;
    const userId = req.user.uid;
    
    if (!queryId || !rating) {
      return res.status(400).json({ error: "QueryId and rating are required" });
    }
    
    const query = await Query.findById(queryId);
    
    // Check if the query belongs to the authenticated user
    if (!query || query.firebaseUid !== userId) {
      return res.status(404).json({ error: "Query not found or unauthorized" });
    }
    
    // Determine sentiment based on rating
    let sentiment = 'neutral';
    if (rating >= 4) sentiment = 'positive';
    if (rating <= 2) sentiment = 'negative';
    
    // Save feedback
    const feedback = new Feedback({
      queryId,
      userId: query.userId,
      firebaseUid: userId,
      rating,
      comment,
      sentiment
    });
    
    await feedback.save();
    
    // Update query with feedback information
    query.feedback = {
      rating,
      comment,
      timestamp: new Date()
    };
    await query.save();
    
    res.json({ success: true, message: "Feedback submitted successfully" });
    
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Escalation route with authentication
router.post('/escalate', authenticateUser, async (req, res) => {
  try {
    const { queryId } = req.body;
    const userId = req.user.uid;
    
    if (!queryId) {
      return res.status(400).json({ error: "QueryId is required" });
    }
    
    const query = await Query.findById(queryId);
    
    // Check if the query belongs to the authenticated user
    if (!query || query.firebaseUid !== userId) {
      return res.status(404).json({ error: "Query not found or unauthorized" });
    }
    
    // Generate ticket ID
    const ticketId = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    
    // Update query with escalation information
    query.escalated = true;
    query.ticketId = ticketId;
    query.escalationTime = new Date();
    await query.save();
    
    // Here you would typically implement logic to notify support staff
    // This could involve sending emails, push notifications, etc.
    // For now, we'll just return the ticket ID
    
    res.json({ 
      success: true, 
      message: "Query escalated successfully", 
      ticketId 
    });
    
  } catch (error) {
    console.error('Error escalating query:', error);
    res.status(500).json({ error: 'Failed to escalate query' });
  }
});

// User history with authentication
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    
    // Find queries associated with this Firebase user ID
    const queries = await Query.find({ firebaseUid: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    // Count total queries for pagination
    const total = await Query.countDocuments({ firebaseUid: userId });
    
    res.json({
      success: true,
      data: queries,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + queries.length < total
      }
    });
    
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get user profile with authentication
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid: userId })
      .select('-__v -password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Add session statistics
    const totalQueries = await Query.countDocuments({ firebaseUid: userId });
    const lastQuery = await Query.findOne({ firebaseUid: userId })
      .sort({ createdAt: -1 })
      .select('createdAt');
    
    res.json({
      success: true,
      profile: {
        ...user.toObject(),
        stats: {
          totalQueries,
          lastActivity: lastQuery ? lastQuery.createdAt : null
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile with authentication
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { department, preferences } = req.body;
    
    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update fields if provided
    if (department) user.department = department;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    user.lastUpdated = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: user
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create Firebase token verification middleware for Express session-based auth
// This is useful if you want to integrate with existing session-based auth systems
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    // Add user info to session if using session-based auth
    if (req.session) {
      req.session.firebaseUid = decodedToken.uid;
      req.session.email = decodedToken.email;
    }
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = router;