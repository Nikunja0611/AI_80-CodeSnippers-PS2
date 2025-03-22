// utils/trainingDataGenerator.js
const FAQ = require('../models/faq');
const Query = require('../models/query');
const fs = require('fs');
const path = require('path');

const generateTrainingData = async () => {
  try {
    // Get successful FAQs (ones with positive feedback)
    const faqs = await FAQ.find({ isActive: true }).lean();
    
    // Get successful queries (rating >= 4)
    const successfulQueries = await Query.aggregate([
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'queryId',
          as: 'feedback'
        }
      },
      {
        $match: {
          'feedback.rating': { $gte: 4 }
        }
      },
      {
        $project: {
          prompt: 1,
          response: 1,
          department: 1
        }
      }
    ]);
    
    // Format data for training
    const trainingData = [
      ...faqs.map(faq => ({
        input: faq.question,
        output: faq.answer,
        category: faq.category,
        department: faq.department
      })),
      ...successfulQueries.map(query => ({
        input: query.prompt,
        output: query.response,
        department: query.department
      }))
    ];
    
    // Write to file
    const outputPath = path.join(__dirname, '../training_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(trainingData, null, 2));
    
    console.log(`Training data generated with ${trainingData.length} examples`);
    return trainingData;
  } catch (error) {
    console.error('Error generating training data:', error);
    throw error;
  }
};

module.exports = { generateTrainingData };