const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../config/firebaseAdmin');
const Query = require('../models/query');
const Feedback = require('../models/feedback');
const Session = require('../models/session');

// Get query analytics
router.get('/queries', authenticateUser, async (req, res) => {
  try {
    const { timeframe = 'week', department } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // Build query conditions
    const conditions = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (department && department !== 'all') {
      conditions.department = department;
    }
    
    // Get total queries
    const totalQueries = await Query.countDocuments(conditions);
    
    // Get queries by source
    const queriesBySource = await Query.aggregate([
      { $match: conditions },
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);
    
    // Get queries by department
    const queriesByDepartment = await Query.aggregate([
      { $match: conditions },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);
    
    // Get queries by intent
    const queriesByIntent = await Query.aggregate([
      { $match: conditions },
      { $group: { _id: "$intentDetected", count: { $sum: 1 } } }
    ]);
    
    // Get average processing time
    const avgProcessingTime = await Query.aggregate([
      { $match: conditions },
      { $group: { _id: null, avg: { $avg: "$processingTime" } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalQueries,
        queriesBySource,
        queriesByDepartment,
        queriesByIntent,
        avgProcessingTime: avgProcessingTime.length > 0 ? avgProcessingTime[0].avg : 0
      }
    });
  } catch (error) {
    console.error("Error fetching query analytics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch query analytics" 
    });
  }
});

// Get feedback analytics
router.get('/feedback', authenticateUser, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // Build query conditions
    const conditions = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    // Get average rating
    const avgRating = await Feedback.aggregate([
      { $match: conditions },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    
    // Get feedback by sentiment
    const feedbackBySentiment = await Feedback.aggregate([
      { $match: conditions },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);
    
    // Get feedback by category
    const feedbackByCategory = await Feedback.aggregate([
      { $match: conditions },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        avgRating: avgRating.length > 0 ? avgRating[0].avg : 0,
        feedbackBySentiment,
        feedbackByCategory,
        totalFeedback: await Feedback.countDocuments(conditions)
      }
    });
  } catch (error) {
    console.error("Error fetching feedback analytics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch feedback analytics" 
    });
  }
});

// Get session analytics
router.get('/sessions', authenticateUser, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // Build query conditions
    const conditions = {
      startTime: { $gte: startDate, $lte: endDate }
    };
    
    // Get total sessions
    const totalSessions = await Session.countDocuments(conditions);
    
    // Get sessions by platform
    const sessionsByPlatform = await Session.aggregate([
      { $match: conditions },
      { $group: { _id: "$platform", count: { $sum: 1 } } }
    ]);
    
    // Get average session duration
    const avgDuration = await Session.aggregate([
      { 
        $match: { 
          ...conditions,
          endTime: { $exists: true }
        } 
      },
      { 
        $project: { 
          duration: { $subtract: ["$endTime", "$startTime"] }
        } 
      },
      { 
        $group: { 
          _id: null, 
          avg: { $avg: "$duration" } 
        } 
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalSessions,
        sessionsByPlatform,
        avgDuration: avgDuration.length > 0 ? avgDuration[0].avg / 1000 : 0, // Convert to seconds
        activeSessions: await Session.countDocuments({ ...conditions, isActive: true })
      }
    });
  } catch (error) {
    console.error("Error fetching session analytics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch session analytics" 
    });
  }
});

// Get dashboard overview
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    // Get today's date and one week ago
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Quick stats
    const totalQueries = await Query.countDocuments();
    const queriesLastWeek = await Query.countDocuments({ 
      createdAt: { $gte: oneWeekAgo, $lte: today }
    });
    
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ isActive: true });
    
    const avgRating = await Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    
    // Get recent queries trend (last 7 days)
    const queryTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Query.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      queryTrend.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }
    
    res.json({
      success: true,
      data: {
        totalQueries,
        queriesLastWeek,
        totalSessions,
        activeSessions,
        avgRating: avgRating.length > 0 ? avgRating[0].avg : 0,
        queryTrend
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch dashboard analytics" 
    });
  }
});

module.exports = router;