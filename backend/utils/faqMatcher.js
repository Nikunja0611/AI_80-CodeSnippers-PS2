// utils/faqMatcher.js

// Simple FAQ list - in a real app this would be in the database
const faqs = [
    {
      module: 'gst',
      question: "How to generate GST invoice?",
      answer: "To generate a GST invoice in NovaERP: 1) Go to Sales > Invoices, 2) Click 'Create New Invoice', 3) Select the customer and add products, 4) Verify the GST rates and HSN codes, 5) Click 'Generate Invoice'. The system will automatically calculate CGST, SGST, or IGST based on the customer's location."
    },
    {
      module: 'sales',
      question: "Where can I see pending orders?",
      answer: "To view pending orders: 1) Navigate to Sales > Orders dashboard, 2) Look for the 'Pending Orders' section or use the filter option to select 'Status: Pending'. You can also access the comprehensive pending orders report from Reports > Sales > Pending Orders Report."
    },
    {
      module: 'inventory',
      question: "How to check inventory status?",
      answer: "To check inventory status: 1) Go to Inventory > Dashboard to see overall stock levels, 2) For specific items, go to Inventory > Stock Query and enter the product code/name, 3) The system will display current stock, allocated quantity, available quantity, and reorder level information."
    },
    {
      module: 'purchase',
      question: "What is the process for return goods?",
      answer: "To process returned goods: 1) Go to Purchase > Return Orders, 2) Click 'Create New Return', 3) Select the original purchase order or add items manually, 4) Enter return quantity and reason, 5) Submit for approval. Once approved, the system will update inventory and generate a credit note if required."
    },
    {
      module: 'sales',
      question: "How to create a new customer?",
      answer: "To create a new customer: 1) Navigate to Sales > Customers, 2) Click 'Add New Customer', 3) Fill in mandatory fields including name, contact information, billing/shipping address, and GSTIN, 4) Set payment terms and credit limit if applicable, 5) Click 'Save'. The customer will now be available for selection in sales transactions."
    }
  ];
  
  // Function to match user query with FAQ
  const matchFAQ = async (query, module) => {
    try {
      // In a real implementation, this would use:
      // 1. Vector embeddings for semantic matching
      // 2. Database stored FAQs with proper indexing
      // 3. More sophisticated relevance scoring
      
      // Simple keyword matching for demo purposes
      const matches = faqs.filter(faq => {
        // If module is specified, filter by module
        if (module !== 'general' && faq.module !== module.toLowerCase()) {
          return false;
        }
        
        // Check if query keywords match FAQ question
        const queryWords = query.toLowerCase().split(' ');
        const faqWords = faq.question.toLowerCase().split(' ');
        
        // Count matching words
        const matchingWords = queryWords.filter(word => 
          word.length > 3 && faqWords.includes(word)
        );
        
        // Return true if there are significant matching words
        return matchingWords.length >= 2;
      });
      
      if (matches.length === 0) {
        return null;
      }
      
      // Simple relevance scoring based on word overlap
      const scoredMatches = matches.map(faq => {
        const queryWords = new Set(query.toLowerCase().split(' ').filter(word => word.length > 3));
        const faqWords = new Set(faq.question.toLowerCase().split(' ').filter(word => word.length > 3));
        
        const intersection = new Set([...queryWords].filter(word => faqWords.has(word)));
        const union = new Set([...queryWords, ...faqWords]);
        
        // Jaccard similarity coefficient
        const relevanceScore = intersection.size / union.size;
        
        return {
          ...faq,
          relevanceScore
        };
      });
      
      // Return the best match
      return scoredMatches.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
    } catch (error) {
      console.error("Error matching FAQ:", error);
      return null;
    }
  };
  
  module.exports = { matchFAQ };