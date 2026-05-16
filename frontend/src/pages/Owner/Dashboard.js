// src/pages/Owner/Dashboard.js - With Sidebar Navigation
import React, { useState, useEffect } from 'react';
import { 
  Users, Package, FileText, TrendingUp, DollarSign, ShoppingCart,
  Activity, Calendar, AlertTriangle, AlertCircle, TrendingDown,
  CheckCircle, Clock, Zap, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ownerService } from '../../services/ownerService';
import OwnerSidebarNavigation from './OwnerSidebarNavigation';
import '../../Styling/pages/Owner/OwnerDashboardPremium.css';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [workerPerformance, setWorkerPerformance] = useState([]);
  const [stockAlerts, setStockAlerts] = useState({
    lowStock: [],
    outOfStock: []
  });
  const [salesTrends, setSalesTrends] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  // When using stockAlerts
const lowStockItems = (stockAlerts?.lowStock || []).slice(0, 5);
const outOfStockItems = (stockAlerts?.outOfStock || []).slice(0, 5);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        workersData,
        stockData,
        trendsData,
        alertsData
      ] = await Promise.all([
        ownerService.getDashboardStats(selectedPeriod),
        ownerService.getWorkerPerformance(selectedPeriod),
        ownerService.getStockAlerts(),
        ownerService.getSalesTrends(selectedPeriod),
        ownerService.getCriticalAlerts()
      ]);

      setStats(statsData);
      setWorkerPerformance(workersData);
      setStockAlerts(stockData);
      setSalesTrends(trendsData);
      setCriticalAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <OwnerSidebarNavigation currentPage="dashboard" />
        <div className="owner-nav-content-wrapper">
          <div className="owner-premium-loading-container">
            <div className="owner-premium-loading-content">
              <div className="owner-premium-spinner"></div>
              <p className="owner-premium-loading-text">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sidebar Navigation */}
      <OwnerSidebarNavigation currentPage="dashboard" />
      
      {/* Main Content with Sidebar Offset */}
      <div className="owner-nav-content-wrapper">
        <div className="owner-premium-container">
          {/* Header */}
          <header className="owner-premium-header">
            <div className="owner-premium-header-content">
              <div className="owner-premium-header-left">
                <div className="owner-premium-header-title-group">
                  <h1 className="owner-premium-title">Owner Dashboard</h1>
                  <div className="owner-premium-title-decoration"></div>
                </div>
                <p className="owner-premium-subtitle">
                  Real-time pharmacy analytics and monitoring
                </p>
              </div>
              
              {/* Period Selector */}
              <div className="owner-premium-period-selector">
                {['today', 'week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`owner-premium-period-btn ${
                      selectedPeriod === period ? 'active' : ''
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Critical Alerts Bar */}
          {criticalAlerts.length > 0 && (
            <div className="owner-premium-alert-bar">
              <div className="owner-premium-alert-content">
                <AlertCircle className="owner-premium-alert-icon" />
                <span className="owner-premium-alert-text">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => navigate('/owner/alerts')}
                  className="owner-premium-alert-btn"
                >
                  View All →
                </button>
              </div>
            </div>
          )}

          <main className="owner-premium-main">
            {/* Key Metrics Grid */}
            <div className="owner-premium-metrics-grid">
              <MetricCard
                title="Total Revenue"
                value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
                change={stats?.revenueChange}
                icon={DollarSign}
                color="green"
                trend={stats?.revenueChange >= 0 ? 'up' : 'down'}
              />
              <MetricCard
                title="Total Bills"
                value={stats?.totalBills || 0}
                change={stats?.billsChange}
                icon={FileText}
                color="blue"
                trend={stats?.billsChange >= 0 ? 'up' : 'down'}
              />
              <MetricCard
                title="Active Workers"
                value={stats?.activeWorkers || 0}
                change={stats?.workersChange}
                icon={Users}
                color="purple"
                trend={stats?.workersChange >= 0 ? 'up' : 'down'}
              />
              <MetricCard
                title="Avg Order Value"
                value={`₹${stats?.avgOrderValue?.toLocaleString() || 0}`}
                change={stats?.aovChange}
                icon={ShoppingCart}
                color="yellow"
                trend={stats?.aovChange >= 0 ? 'up' : 'down'}
              />
            </div>

            {/* Stock Alerts Section */}
            <div className="owner-premium-stock-alerts-grid">
              <StockAlertCard
                title="Out of Stock"
                count={(stockAlerts?.lowStock || []).filter(a => a.type === 'out_of_stock').length}
                items={(stockAlerts?.lowStock || []).filter(a => a.type === 'out_of_stock')}
                color="red"
                icon={AlertTriangle}
              />
              <StockAlertCard
                title="Low Stock"
                count={(stockAlerts?.lowStock || []).filter(a => a.type === 'low_stock').length}
                items={(stockAlerts?.lowStock || []).filter(a => a.type === 'low_stock')}
                color="yellow"
                icon={AlertCircle}
              />
              <StockAlertCard
                title="Critical Demand"
                count={(stockAlerts?.lowStock || []).filter(a => a.type === 'high_demand').length}
                items={(stockAlerts?.lowStock || []).filter(a => a.type === 'high_demand')}
                color="orange"
                icon={Zap}
              />
            </div>

            {/* Main Content Grid */}
            <div className="owner-premium-content-grid">
              {/* Top Performing Workers */}
              <div className="owner-premium-card">
                <div className="owner-premium-card-header">
                  <h2 className="owner-premium-card-title">Top Performers</h2>
                  <button
                    onClick={() => navigate('/owner/workers/performance')}
                    className="owner-premium-view-all-btn"
                  >
                    View All →
                  </button>
                </div>
                <div className="owner-premium-workers-list">
                  {workerPerformance.slice(0, 5).map((worker, index) => (
                    <WorkerPerformanceCard
                      key={worker._id}
                      worker={worker}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </div>

              {/* Sales Trends */}
              <div className="owner-premium-card">
                <div className="owner-premium-card-header">
                  <h2 className="owner-premium-card-title">Sales Trends</h2>
                  <BarChart3 className="owner-premium-card-icon" />
                </div>
                <div className="owner-premium-trends-list">
                  {salesTrends.slice(0, 5).map((trend, index) => (
                    <SalesTrendCard key={index} trend={trend} />
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Stock Alerts Table */}
            <div className="owner-premium-card owner-premium-table-card">
              <div className="owner-premium-card-header">
                <h2 className="owner-premium-card-title">Stock Management</h2>
                <button
                  onClick={() => navigate('/owner/inventory')}
                  className="owner-premium-primary-btn"
                >
                  Manage Inventory
                </button>
              </div>
              
              <div className="owner-premium-table-wrapper">
                <table className="owner-premium-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Current Stock</th>
                      <th>Status</th>
                      <th>Demand Pattern</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stockAlerts?.lowStock || []).slice(0, 10).map((alert) => (
                      <StockAlertRow key={alert._id} alert={alert} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon: Icon, color, trend }) => {
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const trendClass = trend === 'up' ? 'positive' : 'negative';

  return (
    <div className={`owner-premium-metric-card owner-premium-metric-${color}`}>
      <div className="owner-premium-metric-top">
        <div className="owner-premium-metric-icon-wrapper">
          <Icon className="owner-premium-metric-icon" />
        </div>
        {change !== undefined && (
          <div className={`owner-premium-metric-change ${trendClass}`}>
            <TrendIcon className="owner-premium-trend-icon" />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="owner-premium-metric-label">{title}</p>
      <p className="owner-premium-metric-value">{value}</p>
    </div>
  );
};

// Stock Alert Card Component
const StockAlertCard = ({ title, count, items, color, icon: Icon }) => {
  return (
    <div className={`owner-premium-stock-card owner-premium-stock-${color}`}>
      <div className="owner-premium-stock-header">
        <Icon className="owner-premium-stock-icon" />
        <div className="owner-premium-stock-info">
          <p className="owner-premium-stock-count">{count}</p>
          <p className="owner-premium-stock-title">{title}</p>
        </div>
      </div>
      {items.length > 0 && (
        <div className="owner-premium-stock-items">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="owner-premium-stock-item">
              • {item.name} ({item.stock} left)
            </div>
          ))}
          {items.length > 3 && (
            <div className="owner-premium-stock-more">
              +{items.length - 3} more items
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Worker Performance Card Component
const WorkerPerformanceCard = ({ worker, rank }) => {
  return (
    <div className="owner-premium-worker-card">
      <div className="owner-premium-worker-left">
        <div className={`owner-premium-worker-rank rank-${rank}`}>
          #{rank}
        </div>
        <div className="owner-premium-worker-info">
          <p className="owner-premium-worker-name">{worker.name}</p>
          <p className="owner-premium-worker-id">{worker.employeeId}</p>
        </div>
      </div>
      <div className="owner-premium-worker-right">
        <p className="owner-premium-worker-sales">
          ₹{worker.totalSales?.toLocaleString()}
        </p>
        <p className="owner-premium-worker-bills">{worker.totalBills} bills</p>
      </div>
    </div>
  );
};

// Sales Trend Card Component
const SalesTrendCard = ({ trend }) => {
  const getTrendIcon = () => {
    if (trend.growth > 20) return <TrendingUp className="owner-premium-trend-up" />;
    if (trend.growth < -20) return <TrendingDown className="owner-premium-trend-down" />;
    return <Activity className="owner-premium-trend-neutral" />;
  };

  const getTrendClass = () => {
    if (trend.growth > 20) return 'positive';
    if (trend.growth < -20) return 'negative';
    return 'neutral';
  };

  return (
    <div className="owner-premium-trend-card">
      <div className="owner-premium-trend-left">
        {getTrendIcon()}
        <div className="owner-premium-trend-info">
          <p className="owner-premium-trend-name">{trend.name}</p>
          <p className="owner-premium-trend-category">{trend.category}</p>
        </div>
      </div>
      <div className="owner-premium-trend-right">
        <p className="owner-premium-trend-count">{trend.soldCount} sold</p>
        <p className={`owner-premium-trend-growth ${getTrendClass()}`}>
          {trend.growth > 0 ? '+' : ''}{trend.growth}%
        </p>
      </div>
    </div>
  );
};

// Stock Alert Row Component
const StockAlertRow = ({ alert }) => {
  const getStatusBadge = () => {
    switch (alert.type) {
      case 'out_of_stock':
        return <span className="owner-premium-badge badge-danger">Out of Stock</span>;
      case 'low_stock':
        return <span className="owner-premium-badge badge-warning">Low Stock</span>;
      case 'high_demand':
        return <span className="owner-premium-badge badge-orange">High Demand</span>;
      default:
        return <span className="owner-premium-badge badge-normal">Normal</span>;
    }
  };

  const getDemandPattern = () => {
    if (alert.demandSpike) {
      return (
        <span className="owner-premium-demand demand-spike">
          <Zap className="owner-premium-demand-icon" />
          Sudden spike
        </span>
      );
    }
    if (alert.steadyDemand) {
      return <span className="owner-premium-demand demand-steady">Steady</span>;
    }
    return <span className="owner-premium-demand demand-normal">Normal</span>;
  };

  return (
    <tr className="owner-premium-table-row">
      <td className="owner-premium-table-cell">
        <div>
          <p className="owner-premium-medicine-name">{alert.name}</p>
          <p className="owner-premium-medicine-meta">{alert.brand} • {alert.company}</p>
        </div>
      </td>
      <td className="owner-premium-table-cell">
        <div>
          <p className="owner-premium-stock-value">{alert.stock}</p>
          <p className="owner-premium-stock-min">Min: {alert.minStock}</p>
        </div>
      </td>
      <td className="owner-premium-table-cell">{getStatusBadge()}</td>
      <td className="owner-premium-table-cell">{getDemandPattern()}</td>
      <td className="owner-premium-table-cell">
        <button className="owner-premium-action-btn">
          Restock →
        </button>
      </td>
    </tr>
  );
};

export default OwnerDashboard;