// App.js - React Front-end for AskNova

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaPaperPlane, FaThumbsUp, FaThumbsDown, FaRobot } from 'react-icons/fa';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userId: localStorage.getItem('userId') || `user-${Date.now()}`,
    userRole: localStorage.getItem('userRole') || 'general',
    department: localStorage.getItem('department') || 'general'
  });
  const [showFeedback, setShowFeedback] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Save user info to localStorage
  useEffect(() => {
    localStorage.setItem('userId', userInfo.userId);
    localStorage.setItem('userRole', userInfo.userRole);
    localStorage.setItem('department', userInfo.department);
  }, [userInfo]);

  // Initialize sample welcome message
  useEffect(() => {
    setMessages([
      {
        type: 'bot',
        text: "Hello! I'm AskNova, your IDMS ERP assistant. How can I help you today? You can ask me about Sales, Purchase, Inventory, Production, GST, and more.",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Function to send message to backend
const sendMessage = async () => {
  if (!inputText.trim()) return;
  
  const userMessage = {
    type: 'user',
    text: inputText,
    timestamp: new Date()
  };
  
  setMessages([...messages, userMessage]);
  setIsLoading(true);
  setInputText('');
  
  try {
    console.log('Sending request with data:', {
      prompt: userMessage.text,
      userId: userInfo.userId,
      userRole: userInfo.userRole,
      department: userInfo.department,
      isVoiceCommand: isListening
    });
    
    const response = await axios.post('/api/chatbot/query', {
      prompt: userMessage.text,
      userId: userInfo.userId,
      userRole: userInfo.userRole,
      department: userInfo.department,
      isVoiceCommand: isListening
    });
    
    console.log('Response from server:', response.data);
    
    const botMessage = {
      type: 'bot',
      text: response.data.response,
      source: response.data.source,
      modules: response.data.modules,
      timestamp: new Date(),
      id: response.data.queryId, // Use the actual queryId from the backend
      suggestedFaq: response.data.suggestedFaq,
      needsEscalation: response.data.needsEscalation,
      ticketId: response.data.ticketId
    };
    
    setMessages(prev => [...prev, botMessage]);
    setShowFeedback(botMessage.id);
  } catch (error) {
    console.error("Error sending message:", error);
    
    const errorMessage = {
      type: 'bot',
      text: "Sorry, I'm having trouble responding right now. Please try again later.",
      timestamp: new Date(),
      isError: true
    };
    
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};
  // Function to toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Function to submit feedback
  const submitFeedback = async (messageId, rating) => {
    try {
      await axios.post('/api/chatbot/feedback', {
        queryId: messageId,
        rating: rating ? 5 : 1
      });
      
      setShowFeedback(null);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  // Function to escalate to human agent
  const escalateToHuman = async (messageId) => {
    try {
      const response = await axios.post('/api/chatbot/escalate', {
        queryId: messageId,
        userId: userInfo.userId
      });
      
      const escalationMessage = {
        type: 'system',
        text: `Your query has been escalated to a support agent. Ticket ID: ${response.data.ticketId}`,
        timestamp: new Date()
      };
      
      setMessages([...messages, escalationMessage]);
    } catch (error) {
      console.error("Error escalating query:", error);
    }
  };
  // Handle key press events (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <FaRobot size={24} />
        <h1>AskNova - IDMS ERP Assistant</h1>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              
              {msg.suggestedFaq && (
                <div className="suggested-faq">
                  <p>Did you mean: {msg.suggestedFaq.question}?</p>
                </div>
              )}
              
              {msg.needsEscalation && (
                <div className="escalation-option">
                  <button onClick={() => escalateToHuman(msg.id)}>
                    Connect with Support Agent
                  </button>
                </div>
              )}
              
              {showFeedback === msg.id && msg.type === 'bot' && !msg.isError && (
                <div className="feedback-buttons">
                  <p>Was this response helpful?</p>
                  <button onClick={() => submitFeedback(msg.id, true)}>
                    <FaThumbsUp />
                  </button>
                  <button onClick={() => submitFeedback(msg.id, false)}>
                    <FaThumbsDown />
                  </button>
                </div>
              )}
              
              {msg.source && (
                <div className="message-source">
                  Source: {msg.source}
                  {msg.modules && msg.modules.length > 0 && 
                    ` | Modules: ${msg.modules.join(', ')}`}
                </div>
              )}
            </div>
            <div className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot loading">
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about IDMS ERP..."
          rows={1}
        />
        <button 
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title="Voice Input"
        >
          <FaMicrophone />
        </button>
        <button 
          className="send-button" 
          onClick={sendMessage}
          disabled={!inputText.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
      
      <div className="user-info">
        <select 
          value={userInfo.department} 
          onChange={(e) => setUserInfo({...userInfo, department: e.target.value})}
        >
          <option value="general">Department: General</option>
          <option value="sales">Department: Sales</option>
          <option value="purchase">Department: Purchase</option>
          <option value="production">Department: Production</option>
          <option value="stores">Department: Stores</option>
          <option value="finance">Department: Finance</option>
        </select>
      </div>
    </div>
  );
}

export default App;