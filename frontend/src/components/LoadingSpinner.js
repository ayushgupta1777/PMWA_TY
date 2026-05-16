// src/components/LoadingSpinner.js - Enhanced
import React from 'react';
import { Package } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'large', 
  text = 'Loading...', 
  showLogo = true,
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center ${className}`}>
      <div className="text-center">
        {/* Logo */}
        {showLogo && (
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Package className="h-12 w-12 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">PharmaCare</h1>
            </div>
            <p className="text-gray-600">Pharmacy Management System</p>
          </div>
        )}

        {/* Spinner */}
        <div className="mb-4">
          <div className={`animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto ${sizeClasses[size]}`}></div>
        </div>

        {/* Loading Text */}
        {text && (
          <p className={`text-gray-600 ${textSizes[size]}`}>{text}</p>
        )}

        {/* Loading Animation Dots */}
        <div className="flex space-x-1 justify-center mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
