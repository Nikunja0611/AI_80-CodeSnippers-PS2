// App.js - React Front-end for AskNova with Firebase Auth

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from './firebase';
import { auth } from './firebase';
import './App.css';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import UserProfile from './components/UserProfile';
import Chatbot from './components/Chatbot';

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/SignIn" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check auth state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Auth state change will be caught by the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
    <div className="page-overlay">
      <div className="video-bg">
                <video autoPlay loop muted>
                    <source src="/intro.mp4" type="video/mp4" />
                </video>
      </div>
      </div>
      <Routes>
        <Route path="/SignIn" element={
          user ? <Navigate to="/chat" replace /> : <SignIn />
        } />
        <Route path="/SignUp" element={
          user ? <Navigate to="/chat" replace /> : <SignUp />
        } />
        <Route path="/profile" element={
          <ProtectedRoute user={user}>
            <UserProfile user={user} onSignOut={handleSignOut} />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute user={user}>
            <Chatbot user={user} onSignOut={handleSignOut} />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to={user ? "/chat" : "/SignIn"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;