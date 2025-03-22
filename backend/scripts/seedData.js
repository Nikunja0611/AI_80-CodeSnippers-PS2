const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ERPIntegration = require('../models/erpIntegrationModel');
const FAQ = require('../models/faqModel');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample ERP integrations
const erpIntegrations = [
  {
    module: 'hr',
    name: 'Employee Leave Balance',
    endpoint: '/hr/employee/leave-balance',
    description: 'Get current leave balance for an employee',
    method: 'GET',
    parameters: [
      {
        name: 'employeeId',
        type: 'string',
        description: 'Employee ID number',
        required: true
      }
    ],
    sampleResponse: {
      employeeId: '1001',
      name: 'John Doe',
      leaveBalance: {
        annual: 12.5,
        sick: 10,
        casual: 5
      },
      leaveTaken: {
        annual: 2.5,
        sick: 1,
        casual: 0
      }
    },
    responseMapping: {
      'employeeName': 'name',
      'annualLeave': 'leaveBalance.annual',
      'sickLeave': 'leaveBalance.sick',
      'casualLeave': 'leaveBalance.casual'
    },
    isActive: true,
    accessRoles: ['employee', 'manager', 'hr', 'admin']
  },
  {
    module: 'finance',
    name: 'Invoice Status',
    endpoint: '/finance/invoice/status',
    description: 'Check the status of an invoice',
    method: 'GET',
    parameters: [
      {
        name: 'invoiceNumber',
        type: 'string',
        description: 'Invoice number',
        required: true
      }
    ],
    sampleResponse: {
      invoiceNumber: 'INV-2023-001',
      client: 'ACME Corp',
      amount: 5000,
      currency: 'USD',
      issueDate: '2023-01-15',
      dueDate: '2023-02-15',
      status: 'Paid',
      paymentDate: '2023-02-10'
    },
    isActive: true,
    accessRoles: ['finance', 'admin', 'manager']
  },
  {
    module: 'sales',
    name: 'Sales Dashboard Data',
    endpoint: '/sales/dashboard',
    description: 'Get sales dashboard data for reporting',
    method: 'GET',
    parameters: [
      {
        name: 'period',
        type: 'string',
        description: 'Reporting period (daily, weekly, monthly, yearly)',
        required: true
      },
      {
        name: 'startDate',
        type: 'date',
        description: 'Start date for the report',
        required: true
      },
      {
        name: 'endDate',
        type: 'date',
        description: 'End date for the report',
        required: false
      }
    ],
    sampleResponse: {
      period: 'monthly',
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      salesTotal: 125000,
      targetAchievement: 85,
      topProducts: [
        { name: 'Product A', sales: 45000 },
        { name: 'Product B', sales: 32000 },
        { name: 'Product C', sales: 28000 }
      ],
      salesByRegion: {
        'North': 35000,
        'South': 42000,
        'East': 28000,
        'West': 20000
      }
    },
    isActive: true,
    accessRoles: ['sales', 'manager', 'admin']
  },
  {
    module: 'inventory',
    name: 'Stock Status',
    endpoint: '/inventory/stock-status',
    description: 'Check current stock levels',
    method: 'GET',
    parameters: [
      {
        name: 'productId',
        type: 'string',
        description: 'Product ID or SKU',
        required: false
      },
      {
        name: 'warehouse',
        type: 'string',
        description: 'Warehouse location',
        required: false
      }
    ],
    sampleResponse: {
      products: [
        {
          productId: 'SKU001',
          name: 'Product A',
          inStock: 250,
          allocated: 50,
          available: 200,
          reorderPoint: 100,
          status: 'In Stock'
        },
        {
          productId: 'SKU002',
          name: 'Product B',
          inStock: 75,
          allocated: 25,
          available: 50,
          reorderPoint: 100,
          status: 'Low Stock'
        }
      ],
      lastUpdated: '2023-01-20T10:30:00Z'
    },
    isActive: true,
    accessRoles: ['inventory', 'warehouse', 'procurement', 'admin']
  }
];

// Sample FAQs including IDMS ERP System FAQs
const faqs = [
  // Original sample FAQs
  {
    question: 'How do I request leave in the ERP system?',
    answer: 'To request leave, navigate to the ESS (Employee Self-Service) module, select "Leave Management", then click "New Leave Request". Fill in the required details including leave type, dates, and any comments. Submit for approval. You can track the status of your request in the "My Requests" section.',
    category: 'Leave Management',
    department: 'hr',
    keywords: ['leave', 'vacation', 'time off', 'request leave', 'sick leave', 'annual leave'],
    isActive: true
  },
  {
    question: 'How can I check my leave balance?',
    answer: 'You can check your leave balance by logging into the ERP portal, going to ESS (Employee Self-Service), and clicking on "Leave Balance" in the Leave Management section. The system will display your current balances for all leave types you are eligible for.',
    category: 'Leave Management',
    department: 'hr',
    keywords: ['leave balance', 'vacation balance', 'remaining leave', 'available leave'],
    isActive: true
  },
  {
    question: 'How do I find the status of an invoice?',
    answer: 'To check an invoice status, go to the Finance module and select "Accounts Receivable" (for sales invoices) or "Accounts Payable" (for purchase invoices). Use the search function to find your invoice by number, customer/vendor, or date. The status column will show if it\'s draft, sent, partially paid, or fully paid.',
    category: 'Finance',
    department: 'finance',
    keywords: ['invoice', 'invoice status', 'payment status', 'bill', 'payment'],
    isActive: true
  },
  {
    question: 'How do I generate a sales report?',
    answer: 'To generate a sales report, navigate to the "Reports" section in the Sales module. Select "Sales Analysis" and choose the report type (e.g., Sales by Customer, Sales by Product, Sales by Region). Set your parameters including date range, products, and customer groups. Click "Generate Report" and you can export it to Excel, PDF, or other formats as needed.',
    category: 'Reporting',
    department: 'sales',
    keywords: ['sales report', 'report', 'sales analysis', 'revenue report'],
    isActive: true
  },
  {
    question: 'How do I check current inventory levels?',
    answer: 'To check inventory levels, go to the Inventory module and select "Stock Status". You can view overall stock levels or filter by warehouse, product category, or specific products. The system shows current quantities, allocated stock, and available quantities. For more detailed analysis, use the "Inventory Reports" section for stock valuation, movement, and aging reports.',
    category: 'Inventory',
    department: 'inventory',
    keywords: ['inventory', 'stock', 'stock level', 'warehouse', 'product stock'],
    isActive: true
  },
  {
    question: 'How do I reset my password?',
    answer: 'If you need to reset your password, click on the "Forgot Password" link on the ERP login screen. Enter your registered email address, and the system will send you a password reset link. Follow the link in your email to create a new password. If you don\'t receive the email within a few minutes, check your spam folder or contact your system administrator.',
    category: 'Account Management',
    department: 'general',
    keywords: ['password', 'reset password', 'forgot password', 'login', 'account'],
    isActive: true
  },
  
  // IDMS ERP System FAQs - GST Related
  {
    question: 'What is GST and why is it important for businesses?',
    answer: 'GST (Goods and Services Tax) is an indirect tax levied on the supply of goods and services in India. It replaces multiple indirect taxes and ensures a unified taxation system. Businesses must comply with GST regulations to avoid penalties and ensure smooth operations.',
    category: 'GST',
    department: 'finance',
    keywords: ['GST', 'tax', 'indirect tax', 'taxation', 'compliance'],
    isActive: true
  },
  {
    question: 'How does IDMS help in GST compliance?',
    answer: 'IDMS ERP integrates GST into every transaction, ensuring automatic tax calculations, validation of GSTIN, real-time invoice generation, and GST return filing support (GSTR-1, GSTR-3B, etc.).',
    category: 'GST',
    department: 'finance',
    keywords: ['GST', 'compliance', 'tax', 'invoice', 'GSTIN'],
    isActive: true
  },
  {
    question: 'What are the different types of GST in IDMS?',
    answer: 'IDMS supports various GST types: CGST (Central GST) and SGST (State GST) for intra-state sales, IGST (Integrated GST) for inter-state sales, and UTGST (Union Territory GST) for sales within Union Territories. CGST is collected by the Central Government, SGST by State Government, IGST by Central Government, and UTGST by the UT Government.',
    category: 'GST',
    department: 'finance',
    keywords: ['GST', 'CGST', 'SGST', 'IGST', 'UTGST', 'tax types'],
    isActive: true
  },
  {
    question: 'What is the role of HSN & SAC codes in IDMS?',
    answer: 'HSN (Harmonized System of Nomenclature) codes classify goods, while SAC (Service Accounting Code) codes classify services for GST purposes. IDMS assigns these codes to each item and service for accurate taxation.',
    category: 'GST',
    department: 'finance',
    keywords: ['HSN', 'SAC', 'tax code', 'classification', 'GST'],
    isActive: true
  },
  {
    question: 'How does E-Invoicing work in IDMS?',
    answer: 'E-invoices are generated digitally and validated through the Government\'s Invoice Registration Portal (IRP), which assigns a unique Invoice Reference Number (IRN) and QR code.',
    category: 'GST',
    department: 'finance',
    keywords: ['e-invoice', 'digital invoice', 'IRN', 'QR code', 'invoice'],
    isActive: true
  },
  {
    question: 'When is an E-Way Bill required?',
    answer: 'If goods worth more than ₹50,000 are being transported, an E-Way Bill must be generated via IDMS. It contains transporter details, invoice information, and route details.',
    category: 'GST',
    department: 'logistics',
    keywords: ['e-way bill', 'transportation', 'goods movement', 'logistics', 'shipping'],
    isActive: true
  },
  {
    question: 'What is the Reverse Charge Mechanism (RCM) in GST?',
    answer: 'Under RCM, instead of the supplier, the buyer is liable to pay GST to the government for certain transactions (e.g., purchases from unregistered dealers).',
    category: 'GST',
    department: 'finance',
    keywords: ['reverse charge', 'RCM', 'GST', 'tax liability', 'unregistered dealers'],
    isActive: true
  },
  {
    question: 'How does IDMS handle tax invoice vs. proforma invoice?',
    answer: 'A proforma invoice is a preliminary bill issued before the actual sale, while a tax invoice is a legal document for GST compliance. IDMS automates the conversion of proforma invoices into tax invoices.',
    category: 'Invoicing',
    department: 'finance',
    keywords: ['tax invoice', 'proforma invoice', 'bill', 'invoice', 'GST'],
    isActive: true
  },
  {
    question: 'Can IDMS generate GST returns automatically?',
    answer: 'Yes, IDMS compiles sales and purchase data to generate GSTR-1 (Outward Supplies), GSTR-3B (Monthly Summary Return), and GSTR-2A (Auto-drafted Inward Supplies Report).',
    category: 'GST',
    department: 'finance',
    keywords: ['GST returns', 'GSTR-1', 'GSTR-3B', 'GSTR-2A', 'tax filing'],
    isActive: true
  },
  {
    question: 'How does IDMS help in reconciling GST mismatches?',
    answer: 'IDMS provides detailed GST reports and mismatch reports, ensuring accurate tax data before filing returns.',
    category: 'GST',
    department: 'finance',
    keywords: ['GST reconciliation', 'tax mismatch', 'GST reports', 'filing returns'],
    isActive: true
  },
  
  // IDMS ERP System Structure FAQs
  {
    question: 'What are the main modules in the IDMS ERP System?',
    answer: 'IDMS ERP consists of the following major modules: Sales & NPD (manages quotations, sales orders, invoices, and dispatches), Planning (aligns demand forecasting, material planning, and production schedules), Purchase (handles procurement, supplier management, and purchase orders), Stores (maintains stock levels, material movements, and inventory tracking), Production (controls manufacturing processes, job work, and raw material consumption), Maintenance (manages machine upkeep and preventive maintenance schedules), Quality (ensures compliance through inspections and material validation), Dispatch & Logistics (organizes shipments, transport partners, and delivery tracking), HR & Admin (manages workforce, payroll, and employee records), Accounts & Finance (tracks financial transactions, payments, GST compliance, and reporting), and Settings (provides system configuration, user access management, and role-based permissions).',
    category: 'ERP Overview',
    department: 'general',
    keywords: ['modules', 'ERP structure', 'system overview', 'IDMS modules'],
    isActive: true
  },
  {
    question: 'What is the three-tier data structure in IDMS modules?',
    answer: 'Each module in IDMS follows a three-tier data structure: Masters (store static or reference data that drive transactions, such as Customer Master, Supplier Master, etc.), Transactions (dynamic operations performed in the ERP, such as Sales Order, Purchase Order, etc.), and Reports (provide real-time insights and data analysis, such as Order Confirmation Report, Purchase Register, etc.).',
    category: 'ERP Structure',
    department: 'general',
    keywords: ['data structure', 'masters', 'transactions', 'reports', 'ERP structure'],
    isActive: true
  },
  {
    question: 'What transactions are handled in the Sales Module?',
    answer: 'The Sales Module handles transactions including Quotation, Sales Order (SO), Dispatch Request (DRN), Advanced Shipment Notice (ASN), Proforma Invoice, Service Invoice, E-Way Bill, Sales Credit/Debit Notes, and Cancellation of SO/DRN.',
    category: 'Sales',
    department: 'sales',
    keywords: ['sales transactions', 'sales orders', 'invoices', 'quotations', 'dispatch'],
    isActive: true
  },
  {
    question: 'How does the Purchase Module interact with other modules?',
    answer: 'The Purchase Module is linked with Stores for material availability, requires Finance approval for high-value purchases, and connects with Quality Control for checking incoming materials. It procures raw materials and services required for production.',
    category: 'Purchase',
    department: 'purchase',
    keywords: ['purchase module', 'procurement', 'module integration', 'material purchasing'],
    isActive: true
  },
  {
    question: 'What does the Stores Module manage in IDMS?',
    answer: 'The Stores Module manages inward and outward movement of raw materials, work-in-progress (WIP), and finished goods. It handles transactions like Goods Receipt Note (GRN), Goods Issue Note (GIN), and Stock Transfer (GTE – Intra-movement of material). It receives materials from Purchase, issues raw materials to Production, and stores finished goods for Sales Dispatch.',
    category: 'Inventory',
    department: 'inventory',
    keywords: ['stores module', 'inventory', 'stock management', 'material movement', 'warehouse'],
    isActive: true
  },
  {
    question: 'How does the Production Module work in IDMS?',
    answer: 'The Production Module manages the manufacturing process from raw material to finished product. It handles transactions such as Batch Card Entry (Production Plan), Goods Transfer Request (GTR), Work Orders, and Job Card Entries. It receives raw material from Stores, requires approval from Quality before releasing products, and outputs finished goods to Stores for dispatch.',
    category: 'Production',
    department: 'production',
    keywords: ['production module', 'manufacturing', 'work orders', 'job cards', 'production planning'],
    isActive: true
  },
  {
    question: 'What role does the Quality Module play in IDMS?',
    answer: 'The Quality Module ensures materials, WIP, and finished products meet required standards. It manages Inspection Checklists and Standard Specifications, handles Material Inspection (MRN, PDIR Entries), Job Card Inspections, and Batch Release. It approves materials received from Purchase, approves WIP and finished goods for Production, and ensures quality compliance before Dispatch.',
    category: 'Quality',
    department: 'quality',
    keywords: ['quality module', 'inspection', 'quality control', 'standards', 'material validation'],
    isActive: true
  },
  {
    question: 'How does the Dispatch & Logistics Module function in IDMS?',
    answer: 'The Dispatch & Logistics Module manages order fulfillment, shipping, and invoicing. It handles Shipping Modes, Transport Partners, Sales Order Dispatch (DRN), and Advance Shipment Notices (ASN). It needs approved finished goods from Stores, requires Quality Approval for dispatch, and generates invoices linked with Sales.',
    category: 'Logistics',
    department: 'logistics',
    keywords: ['dispatch module', 'logistics', 'shipping', 'order fulfillment', 'transport'],
    isActive: true
  },
  {
    question: 'How does IDMS handle GST for inter-state vs. intra-state transactions?',
    answer: 'IDMS automatically differentiates between intra-state transactions (where CGST & SGST are applied), inter-state transactions (where IGST is applied), exports (which are zero-rated supply with/without LUT), and reverse charge transactions (where RCM is applicable).',
    category: 'GST',
    department: 'finance',
    keywords: ['inter-state', 'intra-state', 'GST', 'IGST', 'CGST', 'SGST'],
    isActive: true
  },
  {
    question: 'What happens if a sales invoice is cancelled after GST has been filed?',
    answer: 'If an invoice is cancelled before GST filing, it is simply removed. If cancelled after GST return submission, IDMS ensures a Credit Note is issued, adjusting tax liabilities in the next GST cycle.',
    category: 'GST',
    department: 'finance',
    keywords: ['invoice cancellation', 'credit note', 'GST adjustment', 'tax filing'],
    isActive: true
  }
];

// Seed data function
async function seedData() {
  try {
    // Clear existing data
    await ERPIntegration.deleteMany({});
    await FAQ.deleteMany({});
    
    // Insert new data
    await ERPIntegration.insertMany(erpIntegrations);
    await FAQ.insertMany(faqs);
    
    console.log('Seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();