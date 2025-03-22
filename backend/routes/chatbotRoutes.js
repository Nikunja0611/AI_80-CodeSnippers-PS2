const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const FAQ = require("../models/faqModel");
require("dotenv").config();

const router = express.Router();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing!");
  process.exit(1);
}

// ✅ Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

router.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "❌ Question is required!" });

    // ✅ Check MongoDB FAQ first
    const faq = await FAQ.findOne({ question: new RegExp(prompt, "i") });
    if (faq) return res.json({ response: faq.answer });

    // ✅ Use Gemini AI - Correct Model Name & API Version
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response.text(); // Extract AI-generated content

    res.json({ response });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

module.exports = router;
