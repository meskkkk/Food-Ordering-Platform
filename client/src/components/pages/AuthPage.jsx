import React, { useState, useContext } from "react";
import "./Auth.css";
import { FaFacebookF, FaGoogle, FaLinkedinIn } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register States (Added Phone & Confirm Password)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      // 1. Get the role safely (check for lowercase 'admin')
      // Note: Check your database to see if role is "admin" or "Admin"
      const role = result.user?.role || "";

      // 2. Redirect based on role
      if (role === "admin") {
        navigate("/admin"); // <--- Redirects Admins to Dashboard
      } else {
        navigate("/profile"); // <--- Redirects everyone else to Profile
      }
    } else {
      alert(result.message);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Frontend Validation: Check Passwords
    if (regPassword !== regConfirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // 2. Send data to backend (Name, Email, Password, Phone)
    const result = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
    });

    if (result.success) {
      alert("Registration Successful! Please Sign In.");
      setIsRightPanelActive(false); // Switch to login view
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div
        className={`auth-container ${
          isRightPanelActive ? "right-panel-active" : ""
        }`}
        id="container"
      >
        {/* --- SIGN UP FORM --- */}
        <div className="form-container sign-up-container">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1 className="mb-3">Create Account</h1>

            {/* Short inputs logic: We scroll if content is too tall, or adjust padding in CSS */}
            <input
              className="auth-input"
              type="text"
              placeholder="Full Name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="tel"
              placeholder="Phone Number"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Confirm Password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              required
            />

            <button className="auth-btn">Sign Up</button>
          </form>
        </div>

        {/* --- SIGN IN FORM --- */}
        <div className="form-container sign-in-container">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1>Sign in</h1>
            <div className="social-container my-3">
              <a href="#" className="social mx-2">
                <FaFacebookF />
              </a>
              <a href="#" className="social mx-2">
                <FaGoogle />
              </a>
              <a href="#" className="social mx-2">
                <FaLinkedinIn />
              </a>
            </div>
            <span>or use your account</span>
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <a
              href="#"
              className="mt-2 text-muted"
              style={{ fontSize: "12px" }}
            >
              Forgot your password?
            </a>
            <button className="auth-btn">Sign In</button>
          </form>
        </div>

        {/* --- OVERLAY --- */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with us please login with your personal info
              </p>
              <button
                className="auth-btn ghost"
                onClick={() => setIsRightPanelActive(false)}
              >
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button
                className="auth-btn ghost"
                onClick={() => setIsRightPanelActive(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
