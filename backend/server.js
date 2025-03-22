require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const chatbotRoutes = require("./routes/chatbotRoutes"); // Ensure correct path
const erpRoutes = require("./routes/erpRoutes");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"; // Use gemini-1.5-pro or gemini-1.5-flash

// ✅ Validate Environment Variables
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing!");
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing!");
  process.exit(1);
}

console.log("🔑 API Key Loaded:", GEMINI_API_KEY ? "✅ Yes" : "❌ No");
console.log("🤖 Using Gemini Model:", GEMINI_MODEL);

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};
connectDB();

// ✅ Ensure chatbot API route exists
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/erp", erpRoutes);

// ✅ Debugging - Log existing routes
console.log("📌 Available API routes:");
console.log("➡ /api/chatbot/query");
console.log("➡ /api/chatbot/ask"); // Ensure this exists in chatbotRoutes.js

// ✅ Root Endpoint Test
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Server is running!" });
});

// ✅ 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route Not Found" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
