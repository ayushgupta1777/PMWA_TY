import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being checked
  if (loading) {
    return <LoadingSpinner text="Authenticating..." />;
  }

  // If not authenticated, redirect to appropriate login
  if (!isAuthenticated) {
    const loginPath = requiredRole === 'owner' ? '/owner/login' : '/worker/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If role doesn't match, redirect to unauthorized page
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;