// src/pages/Worker/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Package, User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../Styling/pages/Worker/WorkerLoginPremium.css';

const WorkerLogin = () => {
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

    const result = await login(formData, 'worker');
    
    
    if (result.success) {
      localStorage.setItem('userRole', 'worker');
      localStorage.setItem('userName', formData.username);
      navigate('/worker/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="worker-login-premium-container">
      <div className="worker-login-premium-card">
        {/* Header */}
        <div className="worker-login-premium-header">
          <div className="worker-login-premium-logo-container">
            <Package className="worker-login-premium-logo-icon" size={48} color="#ffffff" />
            <h1 className="worker-login-premium-logo-text">PharmaCare</h1>
          </div>
          <h2 className="worker-login-premium-title">Worker Login</h2>
          <p className="worker-login-premium-subtitle">
            Sign in to your worker account to start managing orders
          </p>
        </div>

        {/* Login Form */}
        <div className="worker-login-premium-form-card">
          <form onSubmit={handleSubmit} className="worker-login-premium-form">
            {/* Error Message */}
            {error && (
              <div className="worker-login-premium-error">
                <AlertCircle className="worker-login-premium-error-icon" size={20} />
                <span className="worker-login-premium-error-text">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="worker-login-premium-field">
              <label htmlFor="email" className="worker-login-premium-label">
                Email Address
              </label>
              <div className="worker-login-premium-input-wrapper">
                <User className="worker-login-premium-input-icon" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="worker-login-premium-input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="worker-login-premium-field">
              <label htmlFor="password" className="worker-login-premium-label">
                Password
              </label>
              <div className="worker-login-premium-input-wrapper">
                <Lock className="worker-login-premium-input-icon" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="worker-login-premium-input worker-login-premium-password-input"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="worker-login-premium-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="worker-login-premium-submit"
            >
              {loading ? (
                <div className="worker-login-premium-loading">
                  <div className="worker-login-premium-spinner"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="worker-login-premium-footer">
            <p className="worker-login-premium-footer-text">
              Don't have an account?{' '}
              <Link to="/worker/register" className="worker-login-premium-link">
                Register here
              </Link>
            </p>
            <p className="worker-login-premium-footer-text">
              Are you an owner?{' '}
              <Link to="/owner/login" className="worker-login-premium-link">
                Owner Login
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="worker-login-premium-demo">
          <h3 className="worker-login-premium-demo-title">Demo Credentials:</h3>
          <div className="worker-login-premium-demo-content">
            <p className="worker-login-premium-demo-item">
              <strong>Email:</strong>
              <span>worker@demo.com</span>
            </p>
            <p className="worker-login-premium-demo-item">
              <strong>Password:</strong>
              <span>demo123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerLogin;