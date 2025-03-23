const { TextEncoder } = require('util');

// Sample FAQs (hardcoded for now) - replace with DB in production
const faqs = [
  {
    module: 'sales',
    question: 'How do I view recent sales?',
    answer: 'You can view recent sales by navigating to the Sales Dashboard and clicking on "Recent Transactions".'
  },
  {
    module: 'sales',
    question: 'How do I create a new invoice?',
    answer: 'To create a new invoice, go to Sales > New Invoice and fill in the customer details and line items.'
  },
  {
    module: 'inventory',
    question: 'How do I check stock levels?',
    answer: 'You can check stock levels by going to Inventory > Stock Status and filtering by product or warehouse.'
  },
  {
    module: 'purchase',
    question: 'How do I create a purchase order?',
    answer: 'To create a purchase order, navigate to Purchase > New PO and select the supplier and items to order.'
  },
  {
    module: 'general',
    question: 'How do I reset my password?',
    answer: 'To reset your password, click on "Forgot Password" on the login screen and follow the instructions sent to your email.'
  }
];

// Function to create word embeddings (simplified)
const getEmbedding = (text) => {
  // In production, use actual embeddings from Gemini or similar
  return text.toLowerCase().split(' ').filter(w => w.length > 2);
};

/**
 * Matches user query to FAQs using semantic similarity
 * @param {string} query - The user's question
 * @param {string} department - The department/module context
 * @returns {Promise<Object|null>} - Best matching FAQ or null if no good match
 */
const matchFAQ = async (query, department = 'general') => {
  try {
    // Convert query to embedding
    const queryEmbedding = getEmbedding(query);
    
    // Calculate similarity scores
    const scoredMatches = faqs.map(faq => {
      // If department specified, prioritize matching department
      const deptMultiplier = 
        (department !== 'general' && faq.module === department.toLowerCase()) ? 1.5 : 1.0;
      
      const faqEmbedding = getEmbedding(faq.question);
      
      // Calculate cosine similarity (simplified)
      const matchingTerms = queryEmbedding.filter(term => faqEmbedding.includes(term));
      const confidence = (matchingTerms.length / Math.max(queryEmbedding.length, 1)) * deptMultiplier;
      
      return {
        faq,
        confidence,
        matched: confidence > 0.3
      };
    });
    
    // Sort by confidence score
    const bestMatch = scoredMatches.sort((a, b) => b.confidence - a.confidence)[0];
    
    return bestMatch && bestMatch.confidence > 0.3 ? bestMatch : null;
  } catch (error) {
    console.error("Error matching FAQ:", error);
    return null;
  }
};

module.exports = { matchFAQ };