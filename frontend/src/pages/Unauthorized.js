import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div className="mb-8">
          <Shield className="h-24 w-24 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page. Please check your account privileges.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/worker/login"
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Worker Login</span>
            </Link>
            <Link
              to="/owner/login"
              className="inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Owner Login</span>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please contact your administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;