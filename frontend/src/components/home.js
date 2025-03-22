import React, { useRef, useEffect } from 'react';
import './home.css';

const Home = () => {
  const scrollContainerRef = useRef(null);

  // Horizontal scroll effect with mouse wheel
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e) => {
      if (scrollContainer) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel);
    
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Video Background */}
      <video autoPlay muted loop className="video-background">
        <source src="video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Navigation Bar */}
      <header className="header">
        <div className="nav-container">
          <div className="left-nav">
            <span className="asknova-brand">ASKNOVA</span>
          </div>
          
          <div className="right-nav">
            <div className="search-container">
              <input type="text" placeholder="Search" className="search-input" />
              <button className="search-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" 
                    stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="user-nav">
              <a href="#" className="nav-link">About Us</a>
              <a href="#" className="nav-link">Profile</a>
              <a href="#" className="nav-link sign-in">Sign In</a>
            </div>
          </div>
        </div>
      </header>
      
      {/* Announcement Banner */}
      <div className="announcement-banner">
        <p>A new era of AskNova: Now without limits for Voice and Think Deeper. <a href="#">Learn more &gt;</a></p>
      </div>
      
      {/* Main Content */}
      <main className="main-content">
        <h1 className="asknova-heading">AskNova</h1>
        
        <div className="lets-talk-container">
          <h2 className="lets-talk">Let's talk</h2>
          
          <div className="chat-input-container">
            <svg className="asknova-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="2"/>
              <path d="M8 12H16" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 8V16" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Message AskNova" className="chat-input" />
            <button className="mic-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1C10.8954 1 10 1.89543 10 3V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V3C14 1.89543 13.1046 1 12 1Z" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19V23" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 23H16" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <h3 className="help-text">How can AskNova help you?</h3>
      </main>
      
      {/* Horizontal Scroll Section */}
      <div className="h-scroll-wrapper">
        <div className="h-scroll-container" ref={scrollContainerRef}>
          <div className="scroll-item">
            <div className="scroll-content">
              <h3>Chat with AskNova</h3>
              <p>Start a conversation to get clear answers to tough questions, turn ideas into images, or craft content the way you want it.</p>
            </div>
          </div>
          <div className="scroll-item">
            <div className="scroll-content">
              <h3>Get creative inspiration</h3>
              <p>Find new ideas, create images, and express yourself in ways you never thought possible.</p>
            </div>
          </div>
          <div className="scroll-item">
            <div className="scroll-content">
              <h3>Work smarter, not harder</h3>
              <p>Let AskNova tackle your writing tasks, summarize complex information, and help you learn new skills.</p>
            </div>
          </div>
          <div className="scroll-item">
            <div className="scroll-content">
              <h3>Discover new possibilities</h3>
              <p>Explore the web, get personalized recommendations, and find answers to your most pressing questions.</p>
            </div>
          </div>
          <div className="scroll-item">
            <div className="scroll-content">
              <h3>Voice and Think Deeper</h3>
              <p>Now without limits. Experience AskNova's enhanced voice capabilities and deeper thinking for more nuanced responses.</p>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <span>Scroll to explore →</span>
        </div>
      </div>
      
      {/* Alternating Content Boxes */}
      <div className="content-boxes">
        <div className="content-box">
          <div className="box-image">
            <img src="/api/placeholder/600/400" alt="AI Assistant" />
          </div>
          <div className="box-text">
            <h3>Advanced AI Capabilities</h3>
            <p>Experience cutting-edge artificial intelligence technology that understands your questions, learns from context, and provides thoughtful, relevant responses to help you accomplish more in less time.</p>
            <a href="#" className="learn-more">Learn more about AI capabilities</a>
          </div>
        </div>
        
        <div className="content-box reverse">
          <div className="box-image">
            <img src="/api/placeholder/600/400" alt="Creative Tools" />
          </div>
          <div className="box-text">
            <h3>Unlock Your Creativity</h3>
            <p>From writing assistance to image generation, AskNova helps unleash your creative potential. Generate ideas, refine your writing, create visual content, and explore new ways to express yourself.</p>
            <a href="#" className="learn-more">Explore creative features</a>
          </div>
        </div>
        
        <div className="content-box">
          <div className="box-image">
            <img src="/api/placeholder/600/400" alt="Productivity Enhancement" />
          </div>
          <div className="box-text">
            <h3>Boost Your Productivity</h3>
            <p>Save time on repetitive tasks, quickly find information, summarize lengthy content, and receive personalized recommendations that help you work more efficiently across all your devices.</p>
            <a href="#" className="learn-more">See productivity tools</a>
          </div>
        </div>
      </div>
      
      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-column">
              <h4>AskNova</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Products</h4>
              <ul>
                <li><a href="#">AskNova Pro</a></li>
                <li><a href="#">Enterprise Solutions</a></li>
                <li><a href="#">Integrations</a></li>
                <li><a href="#">API Access</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Tutorials</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Connect</h4>
              <div className="social-icons">
                <a href="#" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 3.01s-4.586 1.34-7.998 1.54C13.141 2.24 9.97 2 9.97 2 9.97 2 6.738 2.58 4.5 4.5 2.305 6.379 2 10 2 10s-.771 3.063 1 6c1.775 2.95 4 4 4 4s2.236 1 7 1c4.764 0 8-2.5 8-2.5l1-3.5-4.25-3.5L19.5 7l4.5 1.5-1 1-4.5-1 3 2-8 6-5.5-3L7 15l4 3-4.5.5L8 20l3.5-.5-1.25 2s1.649 1.95 8.75.5c7.101-1.45 5-17 5-17z" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="#" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2a2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 9h4v12H2z" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="4" cy="4" r="2" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="#" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="#" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="#D4AF37"/>
                  </svg>
                </a>
              </div>
              <div className="newsletter">
                <p>Subscribe to our newsletter</p>
                <div className="newsletter-input">
                  <input type="email" placeholder="Your email" />
                  <button>Subscribe</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">© 2025 AskNova. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Cookie Policy</a>
              <a href="#">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;