// src/pages/Owner/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Package, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../Styling/pages/Owner/LoginPremium.css';

const OwnerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData, 'owner');
    
    if (result.success) {
      navigate('/owner/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-premium-container">
      <div className="login-premium-background-decoration"></div>
      <div className="login-premium-wrapper">
        {/* Header */}
        <div className="login-premium-header">
          <div className="login-premium-logo-wrapper">
            <div className="login-premium-logo-icon">
              <Package className="login-premium-package-icon" />
            </div>
            <h1 className="login-premium-brand-name">PharmaCare</h1>
          </div>
          <h2 className="login-premium-title">Owner Login</h2>
          <p className="login-premium-subtitle">
            Sign in to your admin account to manage your pharmacy
          </p>
        </div>

        {/* Login Form */}
        <div className="login-premium-form-card">
          <form onSubmit={handleSubmit} className="login-premium-form">
            {/* Error Message */}
            {error && (
              <div className="login-premium-error-banner">
                <AlertCircle className="login-premium-error-icon" />
                <span className="login-premium-error-text">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="login-premium-form-group">
              <label htmlFor="email" className="login-premium-label">
                Email Address
              </label>
              <div className="login-premium-input-wrapper">
                <div className="login-premium-input-icon">
                  <User className="login-premium-icon" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="login-premium-input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-premium-form-group">
              <label htmlFor="password" className="login-premium-label">
                Password
              </label>
              <div className="login-premium-input-wrapper">
                <div className="login-premium-input-icon">
                  <Lock className="login-premium-icon" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="login-premium-input login-premium-input-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-premium-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="login-premium-icon" />
                  ) : (
                    <Eye className="login-premium-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-premium-submit-button"
            >
              {loading ? (
                <div className="login-premium-button-loading">
                  <div className="login-premium-spinner"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="login-premium-links">
            <p className="login-premium-link-text">
              Don't have an account?{' '}
              <Link to="/owner/register" className="login-premium-link">
                Register here
              </Link>
            </p>
            <p className="login-premium-link-text">
              Are you a worker?{' '}
              <Link to="/worker/login" className="login-premium-link">
                Worker Login
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="login-premium-demo-card">
          <h3 className="login-premium-demo-title">Demo Credentials:</h3>
          <div className="login-premium-demo-content">
            <p className="login-premium-demo-item">
              <strong>Email:</strong> admin@pharmacare.com
            </p>
            <p className="login-premium-demo-item">
              <strong>Password:</strong> admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;