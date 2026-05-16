import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner text="Loading..." />;
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    const dashboardPath = user.role === 'owner' ? '/owner/dashboard' : '/worker/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default PublicRoute;