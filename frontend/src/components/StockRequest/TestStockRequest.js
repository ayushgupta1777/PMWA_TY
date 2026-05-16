// src/pages/Worker/TestStockRequest.js
// USE THIS FOR IMMEDIATE TESTING

import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';

const TestStockRequest = () => {
  const [testResults, setTestResults] = useState({
    componentLoaded: false,
    apiReachable: false,
    tokenExists: false,
    backendRunning: false,
    error: null
  });

  useEffect(() => {
    console.log('🧪 TEST COMPONENT LOADED');
    runTests();
  }, []);

  const runTests = async () => {
    const results = { ...testResults };

    // Test 1: Component loaded
    results.componentLoaded = true;
    console.log('✅ Test 1: Component loaded');

    // Test 2: Token exists
    results.tokenExists = !!localStorage.getItem('token');
    console.log(`${results.tokenExists ? '✅' : '❌'} Test 2: Token exists:`, results.tokenExists);

    // Test 3: Backend running
    try {
      const healthCheck = await fetch('http://localhost:5000/api/tablets/popular', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      results.backendRunning = healthCheck.ok;
      console.log(`${healthCheck.ok ? '✅' : '❌'} Test 3: Backend running:`, healthCheck.status);
    } catch (err) {
      results.backendRunning = false;
      results.error = 'Backend not reachable';
      console.error('❌ Test 3: Backend error:', err);
    }

    // Test 4: Stock Request API
    try {
      const apiTest = await fetch('http://localhost:5000/api/stock-requests/my-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      results.apiReachable = apiTest.ok;
      console.log(`${apiTest.ok ? '✅' : '❌'} Test 4: Stock Request API:`, apiTest.status);
      
      if (apiTest.ok) {
        const data = await apiTest.json();
        console.log('📦 API Response:', data);
      }
    } catch (err) {
      results.apiReachable = false;
      results.error = err.message;
      console.error('❌ Test 4: API error:', err);
    }

    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Stock Request System Test</h1>
          </div>
          <p className="text-gray-600">
            This page tests if the Stock Request system is properly set up.
          </p>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Test Results</h2>

          {/* Test 1 */}
          <TestResult
            passed={testResults.componentLoaded}
            title="Component Loaded"
            description="This test component is rendering correctly"
          />

          {/* Test 2 */}
          <TestResult
            passed={testResults.tokenExists}
            title="Authentication Token"
            description={testResults.tokenExists ? "Token found in localStorage" : "No token found - please login"}
          />

          {/* Test 3 */}
          <TestResult
            passed={testResults.backendRunning}
            title="Backend Server"
            description={testResults.backendRunning ? "Backend is running on port 5000" : "Backend is not reachable"}
          />

          {/* Test 4 */}
          <TestResult
            passed={testResults.apiReachable}
            title="Stock Request API"
            description={testResults.apiReachable ? "Stock request endpoints are working" : "API endpoint not accessible"}
          />

          {/* Error Display */}
          {testResults.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Error Details</p>
                  <p className="text-sm text-red-700 mt-1">{testResults.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diagnostic Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Diagnostic Information</h2>
          <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
            <p><strong>Current Path:</strong> {window.location.pathname}</p>
            <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
            <p><strong>Token Present:</strong> {testResults.tokenExists ? 'Yes' : 'No'}</p>
            <p><strong>React Version:</strong> {React.version}</p>
            <p><strong>Browser:</strong> {navigator.userAgent.split(' ').pop()}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Next Steps</h2>
          <div className="space-y-3 text-sm text-blue-800">
            {!testResults.tokenExists && (
              <p>❌ <strong>Login first</strong> - You need to be authenticated</p>
            )}
            {!testResults.backendRunning && (
              <p>❌ <strong>Start backend server</strong> - Run <code className="bg-blue-100 px-2 py-1 rounded">npm start</code> in backend folder</p>
            )}
            {!testResults.apiReachable && testResults.backendRunning && (
              <p>❌ <strong>Register routes</strong> - Make sure stockRequestRoutes.js is registered in server.js</p>
            )}
            {testResults.apiReachable && (
              <p>✅ <strong>Everything working!</strong> - You can now use the Stock Request system</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={runTests}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Re-run Tests
          </button>
          <button
            onClick={() => window.location.href = '/worker/dashboard'}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              console.clear();
              console.log('Console cleared. Re-running tests...');
              runTests();
            }}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Clear Console & Test
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Backend Setup</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`cd backend
npm install
node scripts/setupStockRequest.js
npm start`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Frontend Setup</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`cd frontend
# Make sure these files exist:
src/hooks/useStockRequests.js
src/services/stockRequestService.js
src/components/StockRequest/MyRequests.js`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Check server.js</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`// backend/src/server.js
const stockRequestRoutes = require('./routes/stockRequestRoutes');
app.use('/api/stock-requests', stockRequestRoutes);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Test Result Component
const TestResult = ({ passed, title, description }) => {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
      passed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      {passed ? (
        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
      ) : (
        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
      )}
      <div className="flex-1">
        <h3 className={`font-semibold ${passed ? 'text-green-900' : 'text-red-900'}`}>
          {title}
        </h3>
        <p className={`text-sm mt-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
          {description}
        </p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        passed 
          ? 'bg-green-200 text-green-800' 
          : 'bg-red-200 text-red-800'
      }`}>
        {passed ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
};

export default TestStockRequest;