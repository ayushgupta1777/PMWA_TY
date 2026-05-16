// src/App.js - Complete Implementation
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Worker Pages
import WorkerLogin from './pages/Worker/Login';
import WorkerRegister from './pages/Worker/Register';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerProfile from './pages/Worker/Profile';
import CartPage from './pages/Worker/Cart';
import SavedItemsPage from './pages/Worker/SavedItems';
import BillHistoryPage from './pages/Worker/BillHistory';

// Owner Pages
// Owner Pages
import OwnerLogin from './pages/Owner/Login';
import OwnerDashboard from './pages/Owner/Dashboard';
import ManageTablets from './pages/Owner/ManageTablets';
import ManageWorkers from './pages/Owner/ManageWorkers';
import WorkerPerformance from './pages/Owner/WorkerPerformance';
import StockRequestManagement from './pages/Owner/StockRequestManagement';
import Reports from './pages/Owner/Reports';
import Vendor from './pages/Owner/Vendor';

// Common Pages
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/Unauthorized';

//Stock Request System
import StockRequestsPage from './components/StockRequest/StockRequestPanel';
import MyRequests from './components/StockRequest/MyRequests';
// import StockRequestManagement from './pages/Owner/StockRequestManagement';
import TestStockRequest from './components/StockRequest/TestStockRequest';

// Styles
import './App.css';
// import WorkerPerformance from './pages/Owner/WorkerPerformance';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Routes>
              {/* Default Route */}
              <Route path="/" element={<Navigate to="/worker/login" replace />} />
              
              {/* Worker Routes */}
              <Route 
                path="/worker/login" 
                element={
                  <PublicRoute>
                    <WorkerLogin />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/worker/register" 
                element={
                  <PublicRoute>
                    <WorkerRegister />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/worker/dashboard" 
                element={
                  <ProtectedRoute requiredRole="worker">
                    <WorkerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/worker/profile" 
                element={
                  <ProtectedRoute requiredRole="worker">
                    <WorkerProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/worker/cart" 
                element={
                  <ProtectedRoute requiredRole="worker">
                    <CartPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/worker/saved-items" 
                element={
                  <ProtectedRoute requiredRole="worker">
                    <SavedItemsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/worker/bills" 
                element={
                  <ProtectedRoute requiredRole="worker">
                    <BillHistoryPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/worker/stock-requests" 
                element={
                  <ProtectedRoute >
                    <StockRequestsPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/test-stock" element={<TestStockRequest />} />


                            <Route 
                path="/worker/myrequests" 
                element={
                  <ProtectedRoute requiredRole="worker">
                    <MyRequests />
                  </ProtectedRoute>
                } 
              />

              {/* Owner Routes */}
              {/* <Route 
                path="/owner/login" 
                element={
                  <PublicRoute>
                    <OwnerLogin />
                  </PublicRoute>
                } 
              /> */}
              
              {/* <Route 
                path="/owner/register" 
                element={
                  <PublicRoute>
                    <OwnerRegister />
                  </PublicRoute>
                } 
              /> */}
              
    {/* ========== OWNER ROUTES ========== */}
              <Route 
                path="/owner/login" 
                element={
                  <PublicRoute>
                    <OwnerLogin />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/owner/dashboard" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Medicines/Tablets Management */}
              <Route 
                path="/owner/tablets" 
                element={
                  // <ProtectedRoute requiredRole="owner">
                    <ManageTablets />
                  //</ProtectedRoute> */}
                } 
              />
              
              <Route 
                path="/owner/medicines" 
                element={
                  // <ProtectedRoute requiredRole="owner">
                    <ManageTablets />
                  // </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/owner/medicines/add" 
                element={
                  // <ProtectedRoute requiredRole="owner">
                    <ManageTablets />
                  // </ProtectedRoute>
                } 
              />
              
              {/* Workers Management */}
              <Route 
                path="/owner/workers" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <ManageWorkers />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/owner/workers/performance/:workerId" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <WorkerPerformance />
                  </ProtectedRoute>
                } 
              />
              
              {/* Stock Requests Management */}
              <Route 
                path="/owner/stock-requests" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <StockRequestManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* Reports */}
              <Route 
                path="/owner/reports" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              
              {/* Inventory - redirect to tablets */}
              <Route 
                path="/owner/inventory" 
                element={
                  <Navigate to="/owner/tablets" replace />
                } 
              />
                   <Route 
                path="/owner/suppliers" 
                element={
<ProtectedRoute requiredRole="owner">
                    <Vendor />
                  </ProtectedRoute>                } 
              />

              {/* ========== CATCH ALL ========== */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;