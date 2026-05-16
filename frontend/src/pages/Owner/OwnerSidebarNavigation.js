// src/components/Owner/OwnerSidebarNavigation.js
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Package, FileText, TrendingUp, 
  ShoppingCart, AlertTriangle, Settings, LogOut, Menu, X,
  ClipboardList, UserCheck, Pill, PackageSearch, BarChart3,
  Clock, Bell, Shield, HelpCircle, ChevronRight, Home
} from 'lucide-react';
import '../../Styling/pages/Owner/OwnerSidebarNavigationPremium.css';
import { ownerService } from '../../services/ownerService';


const OwnerSidebarNavigation = ({ currentPage = 'dashboard' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState('');

    const [stats, setStats] = useState({
      pending: 0,
      approved: 0,
      rejected: 0,
      critical: 0
    });

    useEffect(() => {

      fetchStats();
    }, []);
  

    const fetchStats = async () => {
      try {
        const data = await ownerService.getStockRequestStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

  const navigationItems = [
    {
      section: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          path: '/owner/dashboard',
          badge: null
        },
        // {
        //   id: 'analytics',
        //   label: 'Analytics',
        //   icon: BarChart3,
        //   path: '/owner/analytics',
        //   badge: null
        // }
      ]
    },
    {
      section: 'Inventory Management',
      items: [
        {
          id: 'medicines',
          label: 'Manage Medicines',
          icon: Pill,
          path: '/owner/medicines',
          badge: null
        },
        {
          id: 'stock-requests',
          label: 'Stock Requests',
          icon: PackageSearch,
          path: '/owner/stock-requests',
          badge: stats.pending,
          badgeType: 'warning'
        },
        // {
        //   id: 'low-stock',
        //   label: 'Low Stock Alerts',
        //   icon: AlertTriangle,
        //   path: '/owner/low-stock',
        //   badge: 12,
        //   badgeType: 'danger'
        // },
        {
          id: 'suppliers',
          label: 'Suppliers',
          icon: Package,
          path: '/owner/suppliers',
          badge: null
        }
      ]
    },
    // {
    //   section: 'Staff Management',
    //   items: [
    //     {
    //       id: 'workers',
    //       label: 'Manage Workers',
    //       icon: Users,
    //       path: '/owner/workers',
    //       badge: null
    //     },
    //     // {
    //     //   id: 'worker-performance',
    //     //   label: 'Worker Performance',
    //     //   icon: UserCheck,
    //     //   path: '/owner/workers/performance',
    //     //   badge: null
    //     // },
    //     // {
    //     //   id: 'attendance',
    //     //   label: 'Attendance',
    //     //   icon: Clock,
    //     //   path: '/owner/attendance',
    //     //   badge: null
    //     // }
    //   ]
    // },
    {
      section: 'Sales & Reports',
      items: [
        // {
        //   id: 'sales',
        //   label: 'Sales Overview',
        //   icon: TrendingUp,
        //   path: '/owner/sales',
        //   badge: null
        // },
        {
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          path: '/owner/reports',
          badge: null
        },
        // {
        //   id: 'billing',
        //   label: 'Billing History',
        //   icon: ShoppingCart,
        //   path: '/owner/billing',
        //   badge: null
        // }
      ]
    },
    {
      section: 'System',
      items: [
        // {
        //   id: 'alerts',
        //   label: 'Notifications',
        //   icon: Bell,
        //   path: '/owner/alerts',
        //   badge: 3,
        //   badgeType: 'info'
        // },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/owner/settings',
          badge: null
        },
        {
          id: 'help',
          label: 'Help & Support',
          icon: HelpCircle,
          path: '/owner/help',
          badge: null
        }
      ]
    }
  ];

  const handleNavigation = (path) => {
    // In real implementation, use React Router's navigate
    console.log('Navigating to:', path);
    window.location.href = path;
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="owner-nav-mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="owner-nav-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`owner-nav-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="owner-nav-header">
          <div className="owner-nav-logo">
            <div className="owner-nav-logo-icon">
              <Shield size={28} />
            </div>
            <div className="owner-nav-logo-text">
              <h2>PharmaCare</h2>
              <span>Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="owner-nav-menu">
          {navigationItems.map((section, idx) => (
            <div key={idx} className="owner-nav-section">
              <button
                className="owner-nav-section-header"
                onClick={() => toggleSection(section.section)}
              >
                <span>{section.section}</span>
                <ChevronRight 
                  size={16} 
                  className={`owner-nav-chevron ${expandedSection === section.section ? 'expanded' : ''}`}
                />
              </button>
              
              <div className={`owner-nav-items ${expandedSection === section.section || window.innerWidth > 768 ? 'expanded' : ''}`}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      className={`owner-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <Icon size={20} className="owner-nav-item-icon" />
                      <span className="owner-nav-item-label">{item.label}</span>
                      {item.badge && (
                        <span className={`owner-nav-badge badge-${item.badgeType}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="owner-nav-footer">
          <button
            className="owner-nav-logout"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
          
          <div className="owner-nav-user-info">
            <div className="owner-nav-avatar">
              <Users size={20} />
            </div>
            <div className="owner-nav-user-details">
              <p className="owner-nav-user-name">Admin User</p>
              <p className="owner-nav-user-role">Owner</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default OwnerSidebarNavigation;