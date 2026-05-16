// src/pages/Owner/WorkerPerformance.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, FileText,
  Calendar, Award, Target, Activity, BarChart3
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import '../../Styling/pages/Owner/WorkerPerformancePremium.css';

const WorkerPerformance = () => {
  const navigate = useNavigate();
  const { workerId } = useParams();
  const [worker, setWorker] = useState(null);
  const [stats, setStats] = useState(null);
  const [topMedicines, setTopMedicines] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (workerId) {
      fetchWorkerDetails();
    }
  }, [workerId, selectedPeriod]);

  const fetchWorkerDetails = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getWorkerDetails(workerId, selectedPeriod);
      setWorker(data.worker);
      setStats(data.stats);
      setTopMedicines(data.topMedicines);
      setDailySales(data.dailySales);
    } catch (error) {
      console.error('Failed to fetch worker details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="worker-premium-loading-container">
        <div className="worker-premium-spinner"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="worker-premium-error-container">
        <div className="worker-premium-error-content">
          <h2 className="worker-premium-error-title">Worker Not Found</h2>
          <button
            onClick={() => navigate('/owner/workers')}
            className="worker-premium-error-button"
          >
            Back to Workers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-premium-page">
      {/* Header */}
      <div className="worker-premium-header">
        <div className="worker-premium-header-container">
          <div className="worker-premium-header-content">
            <div className="worker-premium-header-left">
              <button
                onClick={() => navigate('/owner/workers')}
                className="worker-premium-back-button"
              >
                <ArrowLeft className="worker-premium-back-icon" />
                <span>Back</span>
              </button>
              
              <div className="worker-premium-worker-info">
                <h1 className="worker-premium-worker-name">{worker.name}</h1>
                <p className="worker-premium-worker-details">
                  {worker.employeeId} • {worker.department}
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="worker-premium-period-selector">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`worker-premium-period-button ${
                    selectedPeriod === period ? 'worker-premium-period-active' : ''
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="worker-premium-main">
        {/* Performance Overview */}
        <div className="worker-premium-stats-grid">
          <PerformanceCard
            title="Total Sales"
            value={`₹${stats.totalSales?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="green"
          />
          <PerformanceCard
            title="Total Bills"
            value={stats.totalBills || 0}
            icon={FileText}
            color="blue"
          />
          <PerformanceCard
            title="Avg Order Value"
            value={`₹${stats.avgOrderValue?.toFixed(2) || 0}`}
            icon={Target}
            color="purple"
          />
        </div>

        {/* Charts Grid */}
        <div className="worker-premium-charts-grid">
          {/* Daily Sales Chart */}
          <div className="worker-premium-card">
            <div className="worker-premium-card-header">
              <h2 className="worker-premium-card-title">Daily Sales</h2>
              <Activity className="worker-premium-card-icon" />
            </div>
            <div className="worker-premium-sales-list">
              {dailySales.slice(0, 10).map((day, index) => (
                <div key={index} className="worker-premium-sales-item">
                  <span className="worker-premium-sales-date">{day._id}</span>
                  <div className="worker-premium-sales-stats">
                    <span className="worker-premium-sales-bills">
                      {day.bills} bills
                    </span>
                    <span className="worker-premium-sales-amount">
                      ₹{day.sales?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Medicines */}
          <div className="worker-premium-card">
            <div className="worker-premium-card-header">
              <h2 className="worker-premium-card-title">Top Medicines Sold</h2>
              <Award className="worker-premium-card-icon" />
            </div>
            <div className="worker-premium-medicines-list">
              {topMedicines.map((medicine, index) => (
                <div key={index} className="worker-premium-medicine-item">
                  <div className="worker-premium-medicine-left">
                    <div className="worker-premium-medicine-rank">
                      <span className="worker-premium-rank-number">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="worker-premium-medicine-info">
                      <p className="worker-premium-medicine-name">{medicine.name}</p>
                      <p className="worker-premium-medicine-quantity">{medicine.totalQuantity} units</p>
                    </div>
                  </div>
                  <p className="worker-premium-medicine-revenue">
                    ₹{medicine.totalRevenue?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="worker-premium-card">
          <h2 className="worker-premium-card-title worker-premium-insights-title">Performance Insights</h2>
          <div className="worker-premium-insights-grid">
            <InsightCard
              title="Sales Consistency"
              description="Regular daily sales with minimal gaps"
              status="good"
              icon={TrendingUp}
            />
            <InsightCard
              title="Product Knowledge"
              description="Selling diverse range of medicines"
              status="excellent"
              icon={Award}
            />
            <InsightCard
              title="Customer Service"
              description="Average order value above target"
              status="good"
              icon={Target}
            />
            <InsightCard
              title="Activity Level"
              description="Consistent billing throughout the period"
              status="excellent"
              icon={Activity}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// Performance Card Component
const PerformanceCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className={`worker-premium-stat-card worker-premium-stat-${color}`}>
      <div className="worker-premium-stat-header">
        <div className={`worker-premium-stat-icon-wrapper worker-premium-stat-icon-${color}`}>
          <Icon className="worker-premium-stat-icon" />
        </div>
      </div>
      <p className="worker-premium-stat-title">{title}</p>
      <p className="worker-premium-stat-value">{value}</p>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ title, description, status, icon: Icon }) => {
  return (
    <div className={`worker-premium-insight-card worker-premium-insight-${status}`}>
      <div className="worker-premium-insight-content">
        <Icon className="worker-premium-insight-icon" />
        <div className="worker-premium-insight-text">
          <h3 className="worker-premium-insight-title">{title}</h3>
          <p className="worker-premium-insight-description">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkerPerformance;