import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import "./Auth.css";

const SignUp = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [department, setDepartment] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        setIsLoading(true);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with display name
            await updateProfile(userCredential.user, {
                displayName: fullName
            });
            
            alert("Signed up successfully!");
            navigate("/SignIn");
        } catch (error) {
            setError(error.message);
            console.error('Error signing up:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    
    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };
    
    return (
        <div className="auth-page">
            <div className="video-bg">
                <video autoPlay loop muted>
                    <source src="/intro.mp4" type="video/mp4" />
                </video>
            </div>
            <div className="auth-container">
                <div className="auth-video">
                    <video autoPlay loop muted>
                        <source src="/signin.mp4" type="video/mp4" />
                    </video>
                </div>
                <div className="auth-form">
                    <h2>Sign Up</h2>
                    
                    {error && <div className="auth-error">{error}</div>}
                    
                    <form onSubmit={handleSignUp}>
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            required 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                        
                        <input 
                            type="email" 
                            placeholder="Email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        
                        <input 
                            type="text" 
                            placeholder="Username" 
                            required 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        
                        <div className="password-input-container">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength="6"
                            />
                            <span 
                                className={`password-toggle-icon ${showPassword ? "show" : "hide"}`}
                                onClick={togglePasswordVisibility}
                            ></span>
                        </div>
                        
                        <div className="password-input-container">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="Confirm Password" 
                                required 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength="6"
                            />
                            <span 
                                className={`password-toggle-icon ${showConfirmPassword ? "show" : "hide"}`}
                                onClick={toggleConfirmPasswordVisibility}
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
                            {isLoading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>
                    <p>Already have an account? <span onClick={() => navigate("/SignIn")}>Sign In</span></p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;