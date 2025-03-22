const { getContextualInfo } = require('./contextProvider');

/**
 * Create enhanced prompt with context for more accurate responses
 */
const createEnhancedPrompt = async (prompt, userId, department) => {
  try {
    // Get contextual information
    const context = await getContextualInfo(userId, department);
    
    // Build system prompt with context
    const systemPrompt = `
You are AskNova, an AI assistant for the IDMS Enterprise Resource Planning system.
You help employees navigate the ERP system and answer their questions about enterprise processes.

User Info:
- Name: ${context.user.name || 'Employee'}
- Department: ${context.user.department}
- Role: ${context.user.role}

Recent conversation history:
${context.conversationHistory.map(h => `
User: ${h.query}
AskNova: ${h.response}
`).join('\n')}

Available ERP modules:
${context.availableERP.map(erp => `- ${erp.module} (${erp.name}): ${erp.description}`).join('\n')}

When answering:
1. Be concise and professional
2. For data-specific queries, mention you can fetch real-time ERP data
3. For complex process questions, provide step-by-step instructions
4. If you don't know, suggest escalation to a human agent

Now, please help with the following query:
${prompt}
`;

    return {
      enhancedPrompt: systemPrompt,
      context
    };
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    // Fall back to original prompt if enhancement fails
    return {
      enhancedPrompt: prompt,
      context: {}
    };
  }
};

/**
 * Detect intent from user query
 */
const detectQueryIntent = async (query) => {
  // This is a simplified version - in production, you'd use 
  // NLP models or intent classification services
  const intents = {
    sales: ['sales', 'revenue', 'customer', 'order', 'deal', 'pipeline', 'commission'],
    hr: ['employee', 'leave', 'salary', 'payroll', 'vacation', 'benefits', 'attendance'],
    finance: ['invoice', 'payment', 'expense', 'budget', 'cost', 'financial', 'tax'],
    inventory: ['stock', 'inventory', 'warehouse', 'product', 'item', 'supply'],
    production: ['manufacture', 'production', 'assemble', 'quality', 'defect']
  };
  
  const queryLower = query.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      return intent;
    }
  }
  
  return 'general';
};

module.exports = {
  createEnhancedPrompt,
  detectQueryIntent
};