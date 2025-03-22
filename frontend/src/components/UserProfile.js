// UserProfile.js
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import './UserProfile.css';

const UserProfile = ({ user, onSignOut }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <div className="user-profile">
      <button 
        className="profile-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            className="profile-avatar"
          />
        ) : (
          <div className="profile-avatar-fallback">
            <FaUser />
          </div>
        )}
        <span className="profile-name">
          {user.displayName || user.email}
        </span>
      </button>
      
      {showDropdown && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <p className="user-email">{user.email}</p>
          </div>
          
          <div className="dropdown-options">
            <button className="dropdown-option">
              <FaCog /> Settings
            </button>
            
            <button 
              className="dropdown-option signout-option" 
              onClick={handleSignOut}
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;