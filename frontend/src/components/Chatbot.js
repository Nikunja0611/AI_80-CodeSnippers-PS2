import React, { useState } from "react";
import axios from "axios";
import "./Chatbot.css";

const Chatbot = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setResponse("⚠️ Please enter a question.");
      return;
    }

    setLoading(true);
    setResponse(""); // Clear previous response

    try {
      const res = await axios.post(
        "http://localhost:5000/api/chatbot/ask", // Ensure this matches backend route
        { prompt: query },
        { withCredentials: true }
      );

      setResponse(res.data.response);
    } catch (error) {
      console.error("❌ Error fetching response:", error);
      setResponse("⚠️ Error fetching response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="chat-input"
        placeholder="Ask me anything..."
        disabled={loading}
      />
      <button onClick={handleSubmit} className="chat-button" disabled={loading}>
        {loading ? "Thinking..." : "Ask"}
      </button>
      <p className="chat-response">{response}</p>
    </div>
  );
};

export default Chatbot;
