import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Package, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <Package className="h-12 w-12 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">PharmaCare</h1>
        </div>

        {/* 404 Error */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
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
              <span>Worker</span>
            </Link>
            <Link
              to="/owner/login"
              className="inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Owner</span>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Check these common pages:</p>
          <div className="mt-2 space-x-4">
            <Link to="/worker/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <Link to="/worker/cart" className="text-blue-600 hover:underline">
              Cart
            </Link>
            <Link to="/worker/profile" className="text-blue-600 hover:underline">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;