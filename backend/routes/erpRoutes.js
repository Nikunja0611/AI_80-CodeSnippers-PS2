const express = require("express");
const axios = require("axios");
const ERPIntegration = require("../models/erpIntegrationModel");
require("dotenv").config();

const router = express.Router();

// ERP API configuration
const ERP_API_BASE_URL = process.env.ERP_API_BASE_URL || "https://api.idms.example.com";
const ERP_API_KEY = process.env.ERP_API_KEY;
const ERP_AUTH_TOKEN = process.env.ERP_AUTH_TOKEN;

// Authentication middleware for ERP API
const authenticateERPRequest = (req, res, next) => {
  if (!ERP_API_KEY || !ERP_AUTH_TOKEN) {
    return res.status(500).json({ error: "ERP API configuration is missing" });
  }
  next();
};

// Helper function to make ERP API requests
const callERPAPI = async (endpoint, method = "GET", data = null) => {
  try {
    const response = await axios({
      method,
      url: `${ERP_API_BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": ERP_API_KEY,
        "Authorization": `Bearer ${ERP_AUTH_TOKEN}`
      },
      data
    });
    return response.data;
  } catch (error) {
    console.error(`Error calling ERP API (${endpoint}):`, error.message);
    throw new Error(`ERP API error: ${error.message}`);
  }
};

// Get sales data
router.get("/sales", authenticateERPRequest, async (req, res) => {
  try {
    const { startDate, endDate, customerId, status } = req.query;
    
    // Build query parameters for ERP API
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (customerId) queryParams.append("customerId", customerId);
    if (status) queryParams.append("status", status);
    
    const endpoint = `/api/sales?${queryParams.toString()}`;
    const data = await callERPAPI(endpoint);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get purchase data
router.get("/purchase", authenticateERPRequest, async (req, res) => {
  try {
    const { startDate, endDate, supplierId, status } = req.query;
    
    // Build query parameters for ERP API
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (supplierId) queryParams.append("supplierId", supplierId);
    if (status) queryParams.append("status", status);
    
    const endpoint = `/api/purchase?${queryParams.toString()}`;
    const data = await callERPAPI(endpoint);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory data
router.get("/inventory", authenticateERPRequest, async (req, res) => {
  try {
    const { location, category, belowReorderLevel } = req.query;
    
    // Build query parameters for ERP API
    const queryParams = new URLSearchParams();
    if (location) queryParams.append("location", location);
    if (category) queryParams.append("category", category);
    if (belowReorderLevel) queryParams.append("belowReorderLevel", belowReorderLevel);
    
    const endpoint = `/api/inventory?${queryParams.toString()}`;
    const data = await callERPAPI(endpoint);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get production data
router.get("/production", authenticateERPRequest, async (req, res) => {
  try {
    const { batchId, productId, status } = req.query;
    
    // Build query parameters for ERP API
    const queryParams = new URLSearchParams();
    if (batchId) queryParams.append("batchId", batchId);
    if (productId) queryParams.append("productId", productId);
    if (status) queryParams.append("status", status);
    
    const endpoint = `/api/production?${queryParams.toString()}`;
    const data = await callERPAPI(endpoint);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for GST data (used for tax calculations and reporting)
router.get("/gst", authenticateERPRequest, async (req, res) => {
  try {
    const { reportType, period, hsnCode } = req.query;
    
    // Build query parameters for ERP API
    const queryParams = new URLSearchParams();
    if (reportType) queryParams.append("reportType", reportType);
    if (period) queryParams.append("period", period);
    if (hsnCode) queryParams.append("hsnCode", hsnCode);
    
    const endpoint = `/api/finance/gst?${queryParams.toString()}`;
    const data = await callERPAPI(endpoint);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initial setup - load ERP structure into MongoDB for chatbot context
router.post("/setup", async (req, res) => {
  try {
    // Step 1: Set up Sales Module
    const salesModule = {
      name: "Sales",
      description: "Manages customer orders, invoices, shipments, and payments",
      masterData: [
        {
          name: "B2B_Customers",
          description: "Customer details, credit limits",
          apiEndpoint: "/api/sales/customers",
          sampleQueries: ["Show me customer ABC's details", "What's the credit limit for XYZ Industries?"]
        },
        {
          name: "SKU_Master",
          description: "Product details, pricing, HSN codes",
          apiEndpoint: "/api/sales/products",
          sampleQueries: ["Get product SKU123 details", "What's the price of product ABC?"]
        }
      ],
      transactions: [
        {
          name: "Sales_Order",
          description: "Customer purchase orders",
          apiEndpoint: "/api/sales/orders",
          sampleQueries: ["Show me sales order SO12345", "List all pending sales orders"]
        },
        {
          name: "Invoice",
          description: "Billing documents for customers",
          apiEndpoint: "/api/sales/invoices",
          sampleQueries: ["Show invoice INV12345", "List all unpaid invoices"]
        }
      ],
      reports: [
        {
          name: "Sales_Register",
          description: "Report of all sales transactions",
          apiEndpoint: "/api/reports/sales",
          sampleQueries: ["Generate sales report for Q1", "Show me monthly sales by customer"]
        }
      ],
      dependencies: ["Stores", "Finance"],
      contextPrompt: "Sales module handles customer management, order processing, and invoicing. It includes master data for customers and products, transaction processing for orders and invoices, and reporting capabilities."
    };

    // Step 2: Set up Purchase Module
    const purchaseModule = {
      name: "Purchase",
      description: "Manages procurement of materials and services",
      masterData: [
        {
          name: "Supplier_Master",
          description: "Vendor details, credit terms",
          apiEndpoint: "/api/purchase/suppliers",
          sampleQueries: ["Show me supplier ABC's details", "What are the payment terms for XYZ Suppliers?"]
        }
      ],
      transactions: [
        {
          name: "Purchase_Order",
          description: "Orders to suppliers for goods or services",
          apiEndpoint: "/api/purchase/orders",
          sampleQueries: ["Show me purchase order PO12345", "List all pending purchase orders"]
        }
      ],
      reports: [
        {
          name: "Purchase_Register",
          description: "Report of all purchase transactions",
          apiEndpoint: "/api/reports/purchase",
          sampleQueries: ["Generate purchase report for Q1", "Show me monthly purchases by supplier"]
        }
      ],
      dependencies: ["Stores", "Finance"],
      contextPrompt: "Purchase module handles supplier management, procurement processing, and purchase order management. It includes master data for suppliers, transaction processing for purchase orders, and reporting capabilities."
    };

    // Step 3: GST Information
    const gstTypes = [
      {
        gstType: "CGST",
        description: "Central Goods and Services Tax",
        applicableOn: "Intra-state sales",
        collectedBy: "Central Government",
        sampleQueries: ["How is CGST calculated?", "What is the current CGST rate for textiles?"]
      },
      {
        gstType: "SGST",
        description: "State Goods and Services Tax",
        applicableOn: "Intra-state sales",
        collectedBy: "State Government",
        sampleQueries: ["How is SGST calculated?", "What is the SGST filing process?"]
      },
      {
        gstType: "IGST",
        description: "Integrated Goods and Services Tax",
        applicableOn: "Inter-state sales",
        collectedBy: "Central Government",
        sampleQueries: ["When is IGST applicable?", "How do I calculate IGST for exports?"]
      },
      {
        gstType: "UTGST",
        description: "Union Territory Goods and Services Tax",
        applicableOn: "Sales within Union Territories",
        collectedBy: "Union Territory Government",
        sampleQueries: ["Which areas use UTGST?", "How is UTGST different from SGST?"]
      }
    ];

    // Create or update ERP Integration document
    await ERPIntegration.findOneAndUpdate(
      {}, // empty filter to match any document
      {
        modules: [salesModule, purchaseModule],
        gstTypes,
        systemContext: "IDMS ERP is a comprehensive solution for manufacturing industries that streamlines Sales, Purchase, Inventory, Production, Quality Control, Dispatch, Finance, and Accounts with GST compliance.",
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "ERP Integration data loaded successfully" });
  } catch (error) {
    console.error("Error setting up ERP integration:", error);
    res.status(500).json({ error: "Failed to set up ERP integration" });
  }
});

// Load FAQs based on knowledge base
router.post("/load-faqs", async (req, res) => {
  try {
    // GST FAQs from the knowledge base
    const gstFaqs = [
      {
        question: "What is GST and why is it important for businesses?",
        answer: "GST (Goods and Services Tax) is an indirect tax levied on the supply of goods and services in India. It replaces multiple indirect taxes and ensures a unified taxation system. Businesses must comply with GST regulations to avoid penalties and take advantage of input tax credits to optimize tax liability. IDMS ERP system handles GST compliance automatically by tracking all transaction taxes.",
        module: "gst",
        tags: ["gst", "tax", "basics"],
        category: "general",
        relevanceScore: 0.95
      },
      {
        question: "How do I generate a GST-compliant invoice in IDMS?",
        answer: "To generate a GST-compliant invoice in IDMS ERP: 1) Go to Sales > Create Invoice, 2) Select the customer (system will determine CGST/SGST or IGST based on the customer's state), 3) Add items with correct HSN codes, 4) The system will automatically calculate applicable taxes, 5) Click on 'Generate' to create the invoice with all required GST fields. The invoice will include GST registration numbers, HSN codes, tax breakups, and other compliance information.",
        module: "gst",
        tags: ["gst", "invoice", "compliance"],
        category: "transaction",
        relevanceScore: 0.9
      },
      {
        question: "What are HSN codes and how do I use them in IDMS?",
        answer: "HSN (Harmonized System of Nomenclature) codes are standardized 6-8 digit codes that classify goods for GST taxation. In IDMS ERP, HSN codes are managed in the product master data. To use them: 1) Go to Settings > Master Data > Products, 2) Add or edit a product, 3) Enter the correct HSN code in the designated field, 4) Save changes. Once configured, IDMS automatically applies the appropriate HSN code to all transactions involving that product, ensuring GST compliance in invoices and reports.",
        module: "gst",
        tags: ["gst", "hsn", "product setup"],
        category: "master_data",
        relevanceScore: 0.85
      }
    ];

    // Sales FAQs
    const salesFaqs = [
      {
        question: "How do I create a new sales order?",
        answer: "To create a new sales order in IDMS ERP: 1) Navigate to Sales > New Order, 2) Select the customer from the dropdown, 3) Set delivery date and payment terms, 4) Add products by clicking 'Add Item' and selecting from inventory, 5) Review prices and quantities, 6) Add any special instructions or discounts, 7) Click 'Save & Submit' to create the order. The system will automatically generate an order number and update inventory allocations.",
        module: "sales",
        tags: ["sales", "order", "creation"],
        category: "transaction",
        relevanceScore: 0.9
      },
      {
        question: "Where can I find the sales performance dashboard?",
        answer: "The sales performance dashboard is located at: Dashboard > Sales Analytics. This provides real-time visualizations of key metrics including monthly sales trends, top-performing products, customer-wise revenue, order fulfillment rates, and achievement against targets. You can filter by date range, product category, or sales territory. For detailed reports, use the 'Export' button or navigate to Reports > Sales for customizable report options.",
        module: "sales",
        tags: ["sales", "dashboard", "analytics"],
        category: "report",
        relevanceScore: 0.8
      }
    ];

    // Purchase FAQs
    const purchaseFaqs = [
      {
        question: "How do I approve a pending purchase order?",
        answer: "To approve a pending purchase order in IDMS ERP: 1) Go to Purchase > Pending Approvals, 2) Select the PO you want to review, 3) Check details including supplier, items, quantities, prices, and delivery terms, 4) If changes are needed, click 'Request Changes' and add comments, 5) If satisfied, click 'Approve', 6) Enter your authorization code if prompted, 7) The system will notify the purchase team and supplier about the approval. The PO status will change from 'Pending Approval' to 'Approved' and will proceed to the next workflow stage.",
        module: "purchase",
        tags: ["purchase", "approval", "workflow"],
        category: "process",
        relevanceScore: 0.85
      }
    ];

    // Combine all FAQs
    const allFaqs = [...gstFaqs, ...salesFaqs, ...purchaseFaqs];
    
    // Insert FAQs into the database
    await FAQ.insertMany(allFaqs);

    res.json({ 
      success: true, 
      message: `${allFaqs.length} FAQs loaded successfully` 
    });
  } catch (error) {
    console.error("Error loading FAQs:", error);
    res.status(500).json({ error: "Failed to load FAQs" });
  }
});

module.exports = router;