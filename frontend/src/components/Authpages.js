// src/components/AuthPages.js
import React, { useState } from 'react';
import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
  } from '../firebase';
import { FaUser, FaLock, FaEnvelope, FaBuilding } from 'react-icons/fa';
import '../App.css';

export function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      if (onSignIn) onSignIn(userCredential.user);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Sign In to AskNova</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSignIn}>
          <div className="input-group">
            <FaEnvelope />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="input-group">
            <FaLock />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function SignUp({ onSignUp, switchToSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('general');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save additional user info (department)
      localStorage.setItem('department', department);
      localStorage.setItem('userId', userCredential.user.uid);
      
      setLoading(false);
      if (onSignUp) onSignUp(userCredential.user);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Create AskNova Account</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSignUp}>
          <div className="input-group">
            <FaEnvelope />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="input-group">
            <FaLock />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <div className="input-group">
            <FaLock />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          </div>
          <div className="input-group">
            <FaBuilding />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="general">Department: General</option>
              <option value="sales">Department: Sales</option>
              <option value="purchase">Department: Purchase</option>
              <option value="production">Department: Production</option>
              <option value="stores">Department: Stores</option>
              <option value="finance">Department: Finance</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <button onClick={switchToSignIn}>Sign In</button>
        </p>
      </div>
    </div>
  );
}

export function UserProfile({ user, onSignOut }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        <FaUser className="user-icon" />
        <span>{user.email}</span>
      </div>
      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>
    </div>
  );
}