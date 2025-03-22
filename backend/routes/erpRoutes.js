const express = require("express");
const router = express.Router();
const FAQ = require("../models/faqModel");
const UserQuery = require("../models/userQueryModel");

// 📌 Route to fetch all FAQs
router.get("/faqs", async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.json(faqs);
  } catch (error) {
    console.error("❌ Error fetching FAQs:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 📌 Route to add a new FAQ (Admin Only)
router.post("/faqs", async (req, res) => {
  const { question, answer, category } = req.body;
  
  if (!question || !answer) {
    return res.status(400).json({ message: "Question and Answer are required" });
  }

  try {
    const newFAQ = new FAQ({ question, answer, category });
    await newFAQ.save();
    res.status(201).json({ message: "✅ FAQ Added Successfully", faq: newFAQ });
  } catch (error) {
    console.error("❌ Error adding FAQ:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 📌 Route to log user queries
router.post("/queries", async (req, res) => {
  const { query, user } = req.body;
  
  if (!query || !user) {
    return res.status(400).json({ message: "Query and User are required" });
  }

  try {
    const newQuery = new UserQuery({ query, user });
    await newQuery.save();
    res.status(201).json({ message: "✅ User Query Logged", query: newQuery });
  } catch (error) {
    console.error("❌ Error logging query:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 📌 Route to fetch all user queries (For Admin View)
router.get("/queries", async (req, res) => {
  try {
    const queries = await UserQuery.find().sort({ timestamp: -1 });
    res.json(queries);
  } catch (error) {
    console.error("❌ Error fetching user queries:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
