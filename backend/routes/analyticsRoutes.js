// routes/analyticsRoutes.js

const express = require('express');
const router = express.Router();
const Query = require('../models/query');
const User = require('../models/user');
const Feedback = require('../models/feedback');

// Get analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    // Calculate date range based on time range
    const endDate = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // Total queries in selected time range
    const totalQueries = await Query.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Unique users who used the chatbot
    const uniqueUsers = await Query.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate }
    }).then(userIds => userIds.length);
    
    // Query distribution by module
    const moduleDistribution = await Query.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$module', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
      { $sort: { value: -1 } }
    ]);
    
    // Distribution by response type
    const responseTypeDistribution = await Query.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$responseType', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } }
    ]);
    
    // Calculate percentage for response type distribution
    const totalResponseCount = responseTypeDistribution.reduce((sum, item) => sum + item.value, 0);
    responseTypeDistribution.forEach(item => {
      item.value = parseFloat(((item.value / totalResponseCount) * 100).toFixed(1));
    });
    
    // Average feedback rating
    const avgRating = await Feedback.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]).then(result => result.length > 0 ? result[0].avgRating : 0);
    
    // Queries trend over time
    let dailyQueriesTrend;
    if (timeRange === 'day') {
      // Hourly breakdown for today
      dailyQueriesTrend = await Query.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            queries: { $sum: 1 },
            escalations: {
              $sum: { $cond: [{ $eq: ['$needsEscalation', true] }, 1, 0] }
            }
          }
        },
        { 
          $project: {
            _id: 0,
            date: { $concat: [{ $toString: '$_id' }, ':00'] },
            queries: 1,
            escalations: 1
          }
        },
        { $sort: { '_id': 1 } }
      ]);
    } else {
      // Daily breakdown for week/month
      dailyQueriesTrend = await Query.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%m/%d', date: '$createdAt' }
            },
            queries: { $sum: 1 },
            escalations: {
              $sum: { $cond: [{ $eq: ['$needsEscalation', true] }, 1, 0] }
            }
          }
        },
        { 
          $project: {
            _id: 0,
            date: '$_id',
            queries: 1,
            escalations: 1
          }
        },
        { $sort: { 'date': 1 } }
      ]);
    }
    
    // Top queries
    const topQueries = await Query.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$prompt', count: { $sum: 1 } } },
      { $project: { _id: 0, query: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Escalation rate
    const escalatedQueries = await Query.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      needsEscalation: true
    });
    
    const escalationRate = totalQueries > 0 
      ? parseFloat(((escalatedQueries / totalQueries) * 100).toFixed(1))
      : 0;
    
    res.json({
      totalQueries,
      uniqueUsers,
      queryModuleDistribution: moduleDistribution,
      responseTypeDistribution,
      avgRating,
      dailyQueriesTrend,
      topQueries,
      escalationRate
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// Get detailed query metrics
router.get('/queries/detailed', async (req, res) => {
  try {
    const { timeRange, module, responseType } = req.query;
    
    // Calculate date range based on time range
    const endDate = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // Build query filters
    const filters = { createdAt: { $gte: startDate, $lte: endDate } };
    
    if (module && module !== 'all') {
      filters.module = module;
    }
    
    if (responseType && responseType !== 'all') {
      filters.responseType = responseType;
    }
    
    // Get detailed query data with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const queries = await Query.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name department')
      .lean();
    
    const total = await Query.countDocuments(filters);
    
    res.json({
      queries,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching detailed query metrics:", error);
    res.status(500).json({ error: "Failed to fetch query metrics" });
  }
});

// Get user engagement metrics
router.get('/users/engagement', async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    // Calculate date range based on time range
    const endDate = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to week
    }
    
    // User engagement by department
    const departmentEngagement = await Query.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $group: { 
          _id: '$user.department', 
          queryCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { $project: { 
          _id: 0, 
          department: '$_id', 
          queryCount: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { queryCount: -1 } }
    ]);
    
    // User sessions data
    const userSessions = await Query.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $sort: { userId: 1, createdAt: 1 } },
      { $group: {
          _id: '$userId',
          interactions: { $push: '$createdAt' }
        }
      },
      { $project: {
          _id: 0,
          userId: '$_id',
          sessionCount: {
            $size: {
              $reduce: {
                input: { $range: [1, { $size: '$interactions' }] },
                initialValue: [[{ $arrayElemAt: ['$interactions', 0] }]],
                in: {
                  $concatArrays: [
                    '$$value',
                    {
                      $cond: {
                        if: { $gt: [
                          { $subtract: [
                            { $arrayElemAt: ['$interactions', '$$this'] },
                            { $arrayElemAt: ['$interactions', { $subtract: ['$$this', 1] }] }
                          ]},
                          1800000 // 30 minutes in milliseconds
                        ]},
                        then: [[{ $arrayElemAt: ['$interactions', '$$this'] }]],
                        else: [{ $concatArrays: [
                          { $arrayElemAt: ['$$value', -1] },
                          [{ $arrayElemAt: ['$interactions', '$$this'] }]
                        ]}]
                      }
                    }
                  ]
                }
              }
            }
          },
          totalInteractions: { $size: '$interactions' }
        }
      }
    ]);
    
    // Calculate average queries per session
    const avgQueriesPerSession = userSessions.reduce((acc, user) => {
      return acc + (user.totalInteractions / user.sessionCount);
    }, 0) / userSessions.length || 0;
    
    // Return time spent data
    const averageTimeSpent = 4.5; // Minutes - placeholder for actual calculation
    
    res.json({
      departmentEngagement,
      userSessions: {
        totalSessions: userSessions.reduce((acc, user) => acc + user.sessionCount, 0),
        avgQueriesPerSession: parseFloat(avgQueriesPerSession.toFixed(2)),
        averageTimeSpent
      },
      returningUsers: {
        percentage: 68, // Placeholder - would calculate from actual data
        count: Math.round(uniqueUsers * 0.68)
      }
    });
  } catch (error) {
    console.error("Error fetching user engagement metrics:", error);
    res.status(500).json({ error: "Failed to fetch user engagement metrics" });
  }
});

module.exports = router;