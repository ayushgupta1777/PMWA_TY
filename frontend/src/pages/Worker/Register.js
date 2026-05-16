// src/pages/Worker/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Package, User, Lock, Mail, Phone, Badge, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../Styling/pages/Worker/WorkerRegisterPremium.css';

const WorkerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    employeeId: '',
    department: 'Sales'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData, 'worker');
    
    if (result.success) {
      navigate('/worker/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="worker-register-premium-container">
      <div className="worker-register-premium-card">
        {/* Header */}
        <div className="worker-register-premium-header">
          <div className="worker-register-premium-logo-container">
            <Package className="worker-register-premium-logo-icon" size={48} color="#ffffff" />
            <h1 className="worker-register-premium-logo-text">PharmaCare</h1>
          </div>
          <h2 className="worker-register-premium-title">Worker Registration</h2>
          <p className="worker-register-premium-subtitle">
            Create your worker account to get started
          </p>
        </div>

        {/* Registration Form */}
        <div className="worker-register-premium-form-card">
          <form onSubmit={handleSubmit} className="worker-register-premium-form">
            {/* Error Message */}
            {error && (
              <div className="worker-register-premium-error">
                <AlertCircle className="worker-register-premium-error-icon" size={20} />
                <span className="worker-register-premium-error-text">{error}</span>
              </div>
            )}

            {/* Name Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="name" className="worker-register-premium-label">
                Full Name
              </label>
              <div className="worker-register-premium-input-wrapper">
                <User className="worker-register-premium-input-icon" size={20} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="worker-register-premium-input"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="email" className="worker-register-premium-label">
                Email Address
              </label>
              <div className="worker-register-premium-input-wrapper">
                <Mail className="worker-register-premium-input-icon" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="worker-register-premium-input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="phone" className="worker-register-premium-label">
                Phone Number
              </label>
              <div className="worker-register-premium-input-wrapper">
                <Phone className="worker-register-premium-input-icon" size={20} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[6-9][0-9]{9}"
                  className="worker-register-premium-input"
                  placeholder="Enter 10-digit phone number"
                />
              </div>
            </div>

            {/* Employee ID Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="employeeId" className="worker-register-premium-label">
                Employee ID
              </label>
              <div className="worker-register-premium-input-wrapper">
                <Badge className="worker-register-premium-input-icon" size={20} />
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="worker-register-premium-input"
                  placeholder="Enter employee ID (e.g., EMP001)"
                />
              </div>
            </div>

            {/* Department Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="department" className="worker-register-premium-label">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="worker-register-premium-select"
              >
                <option value="Sales">Sales</option>
                <option value="Inventory">Inventory</option>
                <option value="Billing">Billing</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="password" className="worker-register-premium-label">
                Password
              </label>
              <div className="worker-register-premium-input-wrapper">
                <Lock className="worker-register-premium-input-icon" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                  className="worker-register-premium-input"
                  placeholder="Enter password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="worker-register-premium-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="worker-register-premium-field">
              <label htmlFor="confirmPassword" className="worker-register-premium-label">
                Confirm Password
              </label>
              <div className="worker-register-premium-input-wrapper">
                <Lock className="worker-register-premium-input-icon" size={20} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength="6"
                  className="worker-register-premium-input"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="worker-register-premium-password-toggle"
                >
                  {showConfirmPassword ? (
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
              className="worker-register-premium-submit"
            >
              {loading ? (
                <div className="worker-register-premium-loading">
                  <div className="worker-register-premium-spinner"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="worker-register-premium-footer">
            <p className="worker-register-premium-footer-text">
              Already have an account?{' '}
              <Link to="/worker/login" className="worker-register-premium-link">
                Sign in here
              </Link>
            </p>
            <p className="worker-register-premium-footer-text">
              Are you an owner?{' '}
              <Link to="/owner/register" className="worker-register-premium-link">
                Owner Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerRegister;