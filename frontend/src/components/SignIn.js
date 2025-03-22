import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import "./Auth.css";

const SignIn = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showLogoVideo, setShowLogoVideo] = useState(false);
    const logoVideoRef = useRef(null);
    const [email, setEmail] = useState("");  // Changed from username to email
    const [password, setPassword] = useState("");
    const [department, setDepartment] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        
        try {
            // Using email for Firebase auth
            await signInWithEmailAndPassword(auth, email, password);
            
            // Show logo video instead of immediately redirecting
            setShowLogoVideo(true);
        } catch (error) {
            setError(error.message);
            console.error('Error signing in:', error);
            setIsLoading(false);
        }
    };

    const handleLogoVideoEnded = () => {
        // Redirect to Home page after logo video ends
        navigate("/Home");
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-page">
            <div className="video-bg">
                <video autoPlay loop muted>
                    <source src="/intro.mp4" type="video/mp4" />
                </video>
            </div>
            {showLogoVideo ? (
                <div className="logo-video-container">
                    <video 
                        ref={logoVideoRef}
                        autoPlay 
                        muted 
                        onEnded={handleLogoVideoEnded}
                        className="logo-video"
                    >
                        <source src="/logo.mp4" type="video/mp4" />
                    </video>
                </div>
            ) : (
                <div className="auth-container">
                    <div className="auth-video">
                        <video autoPlay loop muted>
                            <source src="/signin.mp4" type="video/mp4" />
                        </video>
                    </div>
                    <div className="auth-form">
                        <h2>Sign In</h2>
                        
                        {error && <div className="auth-error">{error}</div>}
                        
                        <form onSubmit={handleSignIn}>
                            <input 
                                type="email" 
                                placeholder="Email Id" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            
                            <div className="password-input-container">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <span 
                                    className={`password-toggle-icon ${showPassword ? "show" : "hide"}`}
                                    onClick={togglePasswordVisibility}
                                ></span>
                            </div>
                            
                            <select 
                                required
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            >
                                <option value="" disabled>Select Department</option>
                                <option value="general">General</option>
                                <option value="finance">Finance</option>
                                <option value="sales">Sales</option>
                                <option value="stores">Stores</option>
                                <option value="purchase">Purchase</option>
                                <option value="production">Production</option>
                            </select>
                            
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? "Signing In..." : "Sign In"}
                            </button>
                        </form>
                        <p>Don't have an account? <span onClick={() => navigate("/SignUp")}>Sign Up</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignIn;