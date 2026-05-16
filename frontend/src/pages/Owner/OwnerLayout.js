// src/layouts/OwnerLayout.js - Wrapper for all owner pages
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, FileText, 
  LogOut, Menu, X, ShoppingBag, PackageSearch
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OwnerLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/owner/dashboard',
      description: 'Overview & Analytics'
    },
    {
      name: 'Manage Medicines',
      icon: Package,
      path: '/owner/tablets',
      description: 'Add, Edit, Bulk Upload'
    },
    {
      name: 'Manage Workers',
      icon: Users,
      path: '/owner/workers',
      description: 'Staff Performance'
    },
    {
      name: 'Stock Requests',
      icon: PackageSearch,
      path: '/owner/stock-requests',
      description: 'Approve & Order'
    },
    {
      name: 'Reports',
      icon: FileText,
      path: '/owner/reports',
      description: 'Sales & Analytics'
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/owner/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">PharmaCare</h1>
                  <p className="text-xs text-gray-500">Owner Portal</p>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-200 ease-in-out z-30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${active 
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default OwnerLayout;