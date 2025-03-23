import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaMicrophone, FaPaperPlane, FaThumbsUp, FaThumbsDown, FaRobot, FaHistory, FaTrash, FaAngleDown, FaChartBar, FaVolumeUp } from 'react-icons/fa';
import UserProfile from './UserProfile';
import { signOut, auth } from '../firebase';
import './Chatbot.css';

const Chatbot = ({ user, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [chats, setChats] = useState([
    { 
      id: 1, 
      name: 'Chat 1', 
      messages: [
        {
          type: 'bot',
          text: "Hello! I'm AskNova, your IDMS ERP assistant. How can I help you today? You can ask me about Sales, Purchase, Inventory, Production, GST, and more.",
          timestamp: new Date()
        }
      ] 
    },
    { 
      id: 2, 
      name: 'Chat 2', 
      messages: [
        {
          type: 'bot',
          text: "Hello! I'm AskNova, your IDMS ERP assistant. How can I help you today? You can ask me about Sales, Purchase, Inventory, Production, GST, and more.",
          timestamp: new Date()
        }
      ] 
    }
  ]);
  const [activeChat, setActiveChat] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userId: user ? user.uid : localStorage.getItem('userId') || '',
    userRole: localStorage.getItem('userRole') || 'general',
    department: localStorage.getItem('department') || 'general'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [currentChart, setCurrentChart] = useState(null);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Get messages from active chat
  const messages = chats[activeChat]?.messages || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load chat history from localStorage on initial load
  useEffect(() => {
    const savedChats = localStorage.getItem('chatHistory');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        // Convert string timestamps back to Date objects
        const formattedChats = parsedChats.map(chat => ({
          ...chat,
          messages: chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(formattedChats);
      } catch (e) {
        console.error("Error parsing saved chats:", e);
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chats));
  }, [chats]);

  // Check for message in URL params (from landing page)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const messageParam = queryParams.get('message');
    
    if (messageParam) {
      setInputText(messageParam);
      // Optional: auto-send the message after component mounts
      const timer = setTimeout(() => {
        if (messageParam.trim()) {
          const userMessage = {
            type: 'user',
            text: messageParam,
            timestamp: new Date()
          };
          
          updateChatMessages(activeChat, [...messages, userMessage]);
          sendRequestToServer(messageParam);
          // Clear the URL parameter after sending to prevent re-sending on refresh
          navigate('/chat', { replace: true });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Save user info to localStorage
  useEffect(() => {
    if (userInfo.userId) {
      localStorage.setItem('userId', userInfo.userId);
      localStorage.setItem('userRole', userInfo.userRole);
      localStorage.setItem('department', userInfo.department);
    }
  }, [userInfo]);

  // Scroll to bottom whenever messages update or active chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Helper function to update messages in a specific chat
  const updateChatMessages = (chatIndex, newMessages) => {
    const updatedChats = [...chats];
    updatedChats[chatIndex].messages = newMessages;
    setChats(updatedChats);
  };

  // Function to create a new chat
  const createNewChat = () => {
    const newChat = {
      id: Date.now(), // Use timestamp for unique ID
      name: `Chat ${chats.length + 1}`,
      messages: [
        {
          type: 'bot',
          text: "Hello! I'm AskNova, your IDMS ERP assistant. How can I help you today? You can ask me about Sales, Purchase, Inventory, Production, GST, and more.",
          timestamp: new Date()
        }
      ]
    };
    
    setChats([...chats, newChat]);
    setActiveChat(chats.length);
    setDropdownOpen(false);
  };

  // Function to delete the current chat
  const deleteCurrentChat = () => {
    if (chats.length <= 1) {
      // Don't delete if it's the last chat
      return;
    }
    
    const updatedChats = chats.filter((_, index) => index !== activeChat);
    setChats(updatedChats);
    
    // Set active chat to the previous one or the first one
    setActiveChat(activeChat === 0 ? 0 : activeChat - 1);
    setDropdownOpen(false);
  };

  // Function to rename the current chat
  const renameChat = (newName) => {
    const updatedChats = [...chats];
    updatedChats[activeChat].name = newName || `Chat ${activeChat + 1}`;
    setChats(updatedChats);
  };

  // Function to detect if visualization is needed
  const needsVisualization = (text) => {
    const visualKeywords = ['chart', 'graph', 'plot', 'visualize', 'trend', 'compare', 'visualization', 'dashboard'];
    return visualKeywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  // Function to play audio response
  const playAudioResponse = async (messageId) => {
    try {
      if (isPlaying && audioElement) {
        audioElement.pause();
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);
      
      // Fetch audio URL from backend
      const response = await axios.get(`/api/chatbot/tts/${messageId}`);
      
      // Create or reuse audio element
      const audio = audioElement || new Audio(response.data.audioUrl);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  // Function to display chart
  const displayChart = (chartData) => {
    setCurrentChart(chartData);
    setShowChartModal(true);
  };

  // Function to send request to the server
  const sendRequestToServer = async (text) => {
    setIsLoading(true);
    
    // Check if visualization is needed
    const requestVisualization = needsVisualization(text);
    
    try {
      console.log('Sending request with data:', {
        prompt: text,
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        department: userInfo.department,
        isVoiceCommand: isListening,
        needsVisualization: requestVisualization
      });
      
      const response = await axios.post('/api/chatbot/query', {
        prompt: text,
        userId: userInfo.userId,
        userRole: userInfo.userRole,
        department: userInfo.department,
        isVoiceCommand: isListening,
        needsVisualization: requestVisualization,
        platform: 'web' // Could change based on where app is running
      });
      
      console.log('Response from server:', response.data);
      
      const botMessage = {
        type: 'bot',
        text: response.data.response.text || response.data.response,
        source: response.data.source,
        modules: response.data.modules,
        timestamp: new Date(),
        id: response.data.queryId,
        suggestedFaq: response.data.suggestedFaq,
        needsEscalation: response.data.needsEscalation,
        ticketId: response.data.ticketId,
        hasChart: response.data.response.chart || null,
        hasAudio: true // All responses now have potential audio
      };
      
      // Get the current messages to make sure user message is still there
      const currentMessages = chats[activeChat].messages;
      updateChatMessages(activeChat, [...currentMessages, botMessage]);
      setShowFeedback(botMessage.id);
      
      // Auto-rename chat based on first user message if it's still the default name
      if (chats[activeChat].name === `Chat ${activeChat + 1}` && text.length > 0) {
        // Use the first 20 characters of the message or the whole message if shorter
        const shortName = text.length > 20 ? text.substring(0, 20) + '...' : text;
        renameChat(shortName);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage = {
        type: 'bot',
        text: "Sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date(),
        isError: true
      };
      
      // Get the current messages to make sure user message is still there
      const currentMessages = chats[activeChat].messages;
      updateChatMessages(activeChat, [...currentMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to send message
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };
    
    // Store the text to send before clearing the input
    const textToSend = inputText;
    setInputText('');
    
    // Focus back on input after sending
    inputRef.current?.focus();
    
    // Update chat messages immediately with user message
    updateChatMessages(activeChat, [...messages, userMessage]);
    
    // Wait a moment to ensure the user message appears before sending to server
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then send to server
    await sendRequestToServer(textToSend);
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
      
      updateChatMessages(activeChat, [...messages, escalationMessage]);
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

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Function to format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to handle role change
  const handleRoleChange = (e) => {
    setUserInfo({...userInfo, userRole: e.target.value});
  };

  return (
    <div className="app-container">
      {/* Background Video */}
      <div className="video-background">
        <video autoPlay muted loop>
          <source src="/assets/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <FaRobot size={24} />
            <h1>AskNova - IDMS ERP Assistant</h1>
          </div>
          {user && <UserProfile user={user} onSignOut={handleSignOut} />}
        </div>
        
        <div className="chat-history-dropdown" ref={dropdownRef}>
          <div className="current-chat-display" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span>{chats[activeChat]?.name || 'New Chat'}</span>
            <FaAngleDown />
          </div>
          
          {dropdownOpen && (
            <div className="dropdown-menu">
              {chats.map((chat, index) => (
                <div 
                  key={index}
                  className={`dropdown-item ${activeChat === index ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChat(index);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="dropdown-item-content">
                    <span>{chat.name}</span>
                    <span className="dropdown-preview">
                      {chat.messages.length > 1 
                        ? chat.messages.filter(m => m.type === 'user').slice(-1)[0]?.text.substring(0, 25) || 'No messages yet'
                        : 'New conversation'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="dropdown-divider"></div>
              <div className="dropdown-item new-chat" onClick={createNewChat}>
                <span>+ New Chat</span>
              </div>
              {chats.length > 1 && (
                <div className="dropdown-item delete-chat" onClick={deleteCurrentChat}>
                  <FaTrash /> <span>Delete Current Chat</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}
            >
              {msg.type === 'user' && (
                <div className="message-avatar user-avatar">
                  <span>You</span>
                </div>
              )}
              {msg.type === 'bot' && (
                <div className="message-avatar bot-avatar">
                  <FaRobot />
                </div>
              )}
              <div className="message-content">
                <p className={msg.type === 'user' ? 'user-message-text' : ''}>{msg.text}</p>
                
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
                
                {/* Add UI elements for chart and audio if available */}
                {msg.type === 'bot' && !msg.isError && (
                  <div className="message-actions">
                    {msg.hasChart && (
                      <button 
                        className="chart-button" 
                        onClick={() => displayChart(msg.hasChart)}
                        title="View Chart"
                      >
                        <FaChartBar />
                      </button>
                    )}
                    {msg.hasAudio && msg.id && (
                      <button 
                        className={`audio-button ${isPlaying && showFeedback === msg.id ? 'playing' : ''}`}
                        onClick={() => playAudioResponse(msg.id)}
                        title={isPlaying && showFeedback === msg.id ? "Stop Audio" : "Play Audio Response"}
                      >
                        <FaVolumeUp />
                      </button>
                    )}
                  </div>
                )}
                
                {msg.source && (
                  <div className="message-source">
                    Source: {msg.source}
                    {msg.modules && msg.modules.length > 0 && 
                      ` | Modules: ${msg.modules.join(', ')}`}
                  </div>
                )}
                
                <div className="timestamp">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot loading">
              <div className="message-avatar bot-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          <textarea
            ref={inputRef}
            className="chat-input"
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
            className="department-selector"
          >
            <option value="general">Department: General</option>
            <option value="sales">Department: Sales</option>
            <option value="purchase">Department: Purchase</option>
            <option value="production">Department: Production</option>
            <option value="stores">Department: Stores</option>
            <option value="finance">Department: Finance</option>
          </select>
          
          <select 
            value={userInfo.userRole} 
            onChange={handleRoleChange}
            className="role-selector"
          >
            <option value="employee">Role: Employee</option>
            <option value="manager">Role: Manager</option>
            <option value="admin">Role: Admin</option>
            <option value="sales">Role: Sales</option>
            <option value="purchase">Role: Purchase</option>
            <option value="finance">Role: Finance</option>
          </select>
        </div>
      </div>
      
      {/* Chart Modal */}
      {showChartModal && currentChart && (
        <div className="chart-modal">
          <div className="chart-modal-content">
            <div className="chart-modal-header">
              <h3>Data Visualization</h3>
              <button onClick={() => setShowChartModal(false)}>×</button>
            </div>
            <div className="chart-container">
              {/* We would render the chart here using a charting library */}
              <div className="chart-placeholder">
                <p>Chart visualization of type: {currentChart.type}</p>
                {/* Actual chart rendering would happen here using chart libraries */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;