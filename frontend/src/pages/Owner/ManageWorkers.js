// src/pages/Owner/ManageWorkers.js - Premium Styled Version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Users, Eye, TrendingUp, 
  DollarSign, FileText, BarChart3, Filter, Download,
  UserCheck, UserX, Calendar
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import '../../Styling/pages/Owner/ManageWorkersPremium.css';

const ManageWorkers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    status: 'true',
    sortBy: 'totalSales'
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1
  });

  useEffect(() => {
    fetchWorkers();
  }, [searchQuery, filters, pagination.page, selectedPeriod]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      
      const [workersData, performanceData] = await Promise.all([
        ownerService.getAllWorkers({
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          department: filters.department,
          isActive: filters.status
        }),
        ownerService.getWorkerPerformance(selectedPeriod, 100)
      ]);

      const workersWithPerformance = workersData.workers.map(worker => {
        const performance = performanceData.find(p => p._id === worker._id);
        return {
          ...worker,
          performance: performance || {
            totalSales: 0,
            totalBills: 0,
            avgOrderValue: 0
          }
        };
      });

      workersWithPerformance.sort((a, b) => {
        const aVal = a.performance[filters.sortBy] || 0;
        const bVal = b.performance[filters.sortBy] || 0;
        return bVal - aVal;
      });

      setWorkers(workersWithPerformance);
      setPagination(prev => ({
        ...prev,
        totalPages: workersData.totalPages
      }));

    } catch (error) {
      console.error('Failed to fetch workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPerformance = (workerId) => {
    navigate(`/owner/workers/performance/${workerId}`);
  };

  const handleToggleStatus = async (workerId) => {
    try {
      await ownerService.toggleWorkerStatus(workerId);
      fetchWorkers();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    if (window.confirm(`Are you sure you want to delete ${workerName}?`)) {
      try {
        await ownerService.deleteWorker(workerId);
        fetchWorkers();
      } catch (error) {
        console.error('Failed to delete worker:', error);
      }
    }
  };

  const handleExportReport = async () => {
    try {
      const blob = await ownerService.generateWorkersReport(selectedPeriod);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workers-report-${selectedPeriod}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <div className="manage-workers-premium-container">
      {/* Header */}
      <div className="manage-workers-premium-header">
        <div className="manage-workers-premium-header-content">
          <div className="manage-workers-premium-title-section">
            <div className="manage-workers-premium-title-wrapper">
              <h1 className="manage-workers-premium-title">Manage Workers</h1>
              <p className="manage-workers-premium-subtitle">
                Monitor and manage your pharmacy staff performance
              </p>
            </div>
            <div className="manage-workers-premium-header-actions">
              <button
                onClick={handleExportReport}
                className="manage-workers-premium-btn-secondary"
              >
                <Download className="manage-workers-premium-icon" />
                <span>Export Report</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="manage-workers-premium-btn-primary"
              >
                <Plus className="manage-workers-premium-icon" />
                <span>Add Worker</span>
              </button>
            </div>
          </div>

          {/* Performance Period Selector */}
          <div className="manage-workers-premium-period-selector">
            <Calendar className="manage-workers-premium-period-icon" />
            <span className="manage-workers-premium-period-label">Performance Period:</span>
            <div className="manage-workers-premium-period-buttons">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`manage-workers-premium-period-btn ${
                    selectedPeriod === period ? 'active' : ''
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="manage-workers-premium-filters-grid">
            {/* Search */}
            <div className="manage-workers-premium-search-wrapper">
              <Search className="manage-workers-premium-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="manage-workers-premium-search-input"
                placeholder="Search workers..."
              />
            </div>

            {/* Department Filter */}
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="manage-workers-premium-select"
            >
              <option value="">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Inventory">Inventory</option>
              <option value="Billing">Billing</option>
              <option value="General">General</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="manage-workers-premium-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="manage-workers-premium-select"
            >
              <option value="totalSales">Total Sales</option>
              <option value="totalBills">Total Bills</option>
              <option value="avgOrderValue">Avg Order Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workers List */}
      <div className="manage-workers-premium-content">
        {loading ? (
          <div className="manage-workers-premium-loading">
            <div className="manage-workers-premium-spinner"></div>
          </div>
        ) : workers.length === 0 ? (
          <div className="manage-workers-premium-empty-state">
            <Users className="manage-workers-premium-empty-icon" />
            <h3 className="manage-workers-premium-empty-title">No workers found</h3>
            <p className="manage-workers-premium-empty-text">Get started by adding your first worker</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="manage-workers-premium-btn-primary"
            >
              Add Worker
            </button>
          </div>
        ) : (
          <>
            {/* Workers Grid */}
            <div className="manage-workers-premium-grid">
              {workers.map((worker, index) => (
                <WorkerCard
                  key={worker._id}
                  worker={worker}
                  rank={index + 1}
                  onViewPerformance={() => handleViewPerformance(worker._id)}
                  onToggleStatus={() => handleToggleStatus(worker._id)}
                  onDelete={() => handleDeleteWorker(worker._id, worker.name)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="manage-workers-premium-pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="manage-workers-premium-pagination-btn"
                >
                  Previous
                </button>
                <span className="manage-workers-premium-pagination-text">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="manage-workers-premium-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <AddWorkerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchWorkers();
          }}
        />
      )}
    </div>
  );
};

// Worker Card Component
const WorkerCard = ({ worker, rank, onViewPerformance, onToggleStatus, onDelete }) => {
  const getRankBadge = () => {
    if (rank <= 3) {
      const rankClass = `rank-${rank}`;
      return (
        <div className={`manage-workers-premium-rank-badge ${rankClass}`}>
          #{rank}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="manage-workers-premium-card">
      {getRankBadge()}
      
      {/* Worker Info */}
      <div className="manage-workers-premium-card-header">
        <div className="manage-workers-premium-avatar">
          <span className="manage-workers-premium-avatar-text">
            {worker.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="manage-workers-premium-worker-info">
          <h3 className="manage-workers-premium-worker-name">{worker.name}</h3>
          <p className="manage-workers-premium-worker-id">{worker.employeeId}</p>
          <div className="manage-workers-premium-badges">
            <span className="manage-workers-premium-badge badge-department">
              {worker.department}
            </span>
            {worker.isActive ? (
              <span className="manage-workers-premium-badge badge-active">
                <UserCheck className="manage-workers-premium-badge-icon" />
                Active
              </span>
            ) : (
              <span className="manage-workers-premium-badge badge-inactive">
                <UserX className="manage-workers-premium-badge-icon" />
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="manage-workers-premium-stats">
        <div className="manage-workers-premium-stat stat-sales">
          <div className="manage-workers-premium-stat-label">
            <DollarSign className="manage-workers-premium-stat-icon" />
            <span>Total Sales</span>
          </div>
          <span className="manage-workers-premium-stat-value">
            ₹{worker.performance.totalSales?.toLocaleString() || 0}
          </span>
        </div>

        <div className="manage-workers-premium-stat stat-bills">
          <div className="manage-workers-premium-stat-label">
            <FileText className="manage-workers-premium-stat-icon" />
            <span>Total Bills</span>
          </div>
          <span className="manage-workers-premium-stat-value">
            {worker.performance.totalBills || 0}
          </span>
        </div>

        <div className="manage-workers-premium-stat stat-avg">
          <div className="manage-workers-premium-stat-label">
            <BarChart3 className="manage-workers-premium-stat-icon" />
            <span>Avg Order</span>
          </div>
          <span className="manage-workers-premium-stat-value">
            ₹{worker.performance.avgOrderValue?.toFixed(2) || 0}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="manage-workers-premium-card-actions">
        <button
          onClick={onViewPerformance}
          className="manage-workers-premium-btn-view"
        >
          <Eye className="manage-workers-premium-icon" />
          <span>View Details</span>
        </button>
        <button
          onClick={onToggleStatus}
          className={`manage-workers-premium-btn-toggle ${
            worker.isActive ? 'toggle-deactivate' : 'toggle-activate'
          }`}
          title={worker.isActive ? 'Deactivate' : 'Activate'}
        >
          {worker.isActive ? <UserX className="manage-workers-premium-icon" /> : <UserCheck className="manage-workers-premium-icon" />}
        </button>
        <button
          onClick={onDelete}
          className="manage-workers-premium-btn-delete"
          title="Delete"
        >
          <Trash2 className="manage-workers-premium-icon" />
        </button>
      </div>
    </div>
  );
};

// Add Worker Modal Component
const AddWorkerModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeId: '',
    department: 'Sales'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await ownerService.createWorker(formData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-workers-premium-modal-overlay">
      <div className="manage-workers-premium-modal">
        <div className="manage-workers-premium-modal-content">
          <h2 className="manage-workers-premium-modal-title">Add New Worker</h2>
          
          {error && (
            <div className="manage-workers-premium-error-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="manage-workers-premium-form">
            <div className="manage-workers-premium-form-group">
              <label className="manage-workers-premium-label">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="manage-workers-premium-input"
              />
            </div>

            <div className="manage-workers-premium-form-group">
              <label className="manage-workers-premium-label">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="manage-workers-premium-input"
              />
            </div>

            <div className="manage-workers-premium-form-group">
              <label className="manage-workers-premium-label">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="manage-workers-premium-input"
              />
            </div>

            <div className="manage-workers-premium-form-group">
              <label className="manage-workers-premium-label">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="manage-workers-premium-input"
              />
            </div>

            <div className="manage-workers-premium-form-group">
              <label className="manage-workers-premium-label">Employee ID</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                className="manage-workers-premium-input"
                placeholder="EMP001"
              />
            </div>

            <div className="manage-workers-premium-form-group">
              <label className="manage-workers-premium-label">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="manage-workers-premium-select"
              >
                <option value="Sales">Sales</option>
                <option value="Inventory">Inventory</option>
                <option value="Billing">Billing</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="manage-workers-premium-modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="manage-workers-premium-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="manage-workers-premium-btn-submit"
              >
                {loading ? 'Creating...' : 'Create Worker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageWorkers;