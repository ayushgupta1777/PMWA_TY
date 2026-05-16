// src/components/Billing/BillHistory.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Calendar, Download, Eye, Search, Filter, Printer } from 'lucide-react';
import { billService } from '../../services/billService';
import '../../Styling/components/Billing/BillHistoryPremium.css';

const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  useEffect(() => {
    fetchBills();
  }, [pagination.page]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 10,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };

      const response = await billService.getBillHistory(params);
      
      // Handle response structure
      const billsData = response.bills || [];
      const paginationData = response.pagination || { 
        page: 1, 
        totalPages: 1, 
        totalBills: 0 
      };

      setBills(billsData);
      setPagination({
        page: paginationData.page || 1,
        totalPages: paginationData.totalPages || 1,
        totalCount: paginationData.totalBills || 0
      });
      setError('');
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      setError('Failed to load bill history');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBills();
  };

  // ✅ FIXED: Download bill as HTML
  const handleDownloadBill = async (billId, invoiceNumber) => {
    try {
      await billService.downloadBillAsHTML(billId, `invoice-${invoiceNumber}.html`);
    } catch (error) {
      console.error('Failed to download bill:', error);
      alert('Failed to download bill. Please try again.');
    }
  };

  // ✅ FIXED: Print bill
  const handlePrintBill = async (billId) => {
    try {
      await billService.printBillDirect(billId);
    } catch (error) {
      console.error('Failed to print bill:', error);
      alert('Failed to print bill. Please try again.');
    }
  };

  // ✅ View bill details
  const handleViewBill = async (billId) => {
    try {
      const response = await billService.getBill(billId);
      // TODO: Implement modal to show bill details
      console.log('Bill details:', response.bill);
      alert('View details feature - Modal will be implemented here');
    } catch (error) {
      console.error('Failed to view bill:', error);
      alert('Failed to view bill details.');
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'completed': 'billhistory-premium-badge-completed',
      'Completed': 'billhistory-premium-badge-completed',
      'Draft': 'billhistory-premium-badge-draft',
      'draft': 'billhistory-premium-badge-draft',
      'Cancelled': 'billhistory-premium-badge-cancelled',
      'cancelled': 'billhistory-premium-badge-cancelled',
      'Refunded': 'billhistory-premium-badge-refunded',
      'refunded': 'billhistory-premium-badge-refunded'
    };

    const displayStatus = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';

    return (
      <span className={`billhistory-premium-badge ${statusStyles[status] || 'billhistory-premium-badge-default'}`}>
        {displayStatus}
      </span>
    );
  };

  return (
    <div className="billhistory-premium-container">
      {/* Filters */}
      <div className="billhistory-premium-filters-card">
        <div className="billhistory-premium-filters-header">
          <Filter className="billhistory-premium-icon" />
          <h3 className="billhistory-premium-filters-title">Filters</h3>
        </div>

        <div className="billhistory-premium-filters-grid">
          <div className="billhistory-premium-input-group">
            <label className="billhistory-premium-label">
              Search Bills
            </label>
            <div className="billhistory-premium-search-wrapper">
              <Search className="billhistory-premium-search-icon" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="billhistory-premium-input billhistory-premium-search-input"
                placeholder="Invoice number, customer name..."
              />
            </div>
          </div>

          <div className="billhistory-premium-input-group">
            <label className="billhistory-premium-label">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="billhistory-premium-input"
            />
          </div>

          <div className="billhistory-premium-input-group">
            <label className="billhistory-premium-label">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="billhistory-premium-input"
            />
          </div>

          <div className="billhistory-premium-input-group" style={{display: 'flex', alignItems: 'flex-end'}}>
            <button
              onClick={handleApplyFilters}
              className="billhistory-premium-apply-btn"
              style={{
                padding: '10px 20px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#2563EB'}
              onMouseOut={(e) => e.target.style.background = '#3B82F6'}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="billhistory-premium-content-card">
        {loading ? (
          <div className="billhistory-premium-loading">
            <div className="billhistory-premium-spinner"></div>
            <p style={{marginTop: '16px', color: '#6B7280'}}>Loading bills...</p>
          </div>
        ) : error ? (
          <div className="billhistory-premium-error">
            {error}
          </div>
        ) : bills.length === 0 ? (
          <div className="billhistory-premium-empty">
            <Calendar className="billhistory-premium-empty-icon" />
            <p className="billhistory-premium-empty-text">No bills found</p>
            <p style={{fontSize: '14px', color: '#9CA3AF', marginTop: '8px'}}>
              Try adjusting your filters or generate a new bill
            </p>
          </div>
        ) : (
          <div className="billhistory-premium-table-wrapper">
            <table className="billhistory-premium-table">
              <thead className="billhistory-premium-thead">
                <tr>
                  <th className="billhistory-premium-th">Invoice Details</th>
                  <th className="billhistory-premium-th">Customer</th>
                  <th className="billhistory-premium-th">Payment</th>
                  <th className="billhistory-premium-th">Amount</th>
                  <th className="billhistory-premium-th">Status</th>
                  <th className="billhistory-premium-th billhistory-premium-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody className="billhistory-premium-tbody">
                {bills.map((bill) => (
                  <tr key={bill._id} className="billhistory-premium-row">
                    <td className="billhistory-premium-td">
                      <div>
                        <p className="billhistory-premium-bill-number">
                          {bill.invoiceNumber || bill.billNumber || 'N/A'}
                        </p>
                        <p className="billhistory-premium-bill-date">
                          {new Date(bill.date || bill.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {' at '}
                          {new Date(bill.date || bill.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="billhistory-premium-td">
                      <div>
                        <p className="billhistory-premium-customer-name">
                          {bill.customerName || bill.customer?.name || 'Walk-in'}
                        </p>
                        {(bill.customerPhone || bill.customer?.phone) && (
                          <p className="billhistory-premium-customer-phone">
                            {bill.customerPhone || bill.customer?.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="billhistory-premium-td">
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: bill.paymentMethod === 'cash' ? '#D1FAE5' : 
                                   bill.paymentMethod === 'card' ? '#DBEAFE' : '#FEF3C7',
                        color: bill.paymentMethod === 'cash' ? '#065F46' : 
                               bill.paymentMethod === 'card' ? '#1E40AF' : '#92400E'
                      }}>
                        {bill.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td className="billhistory-premium-td">
                      <p className="billhistory-premium-amount">
                        ₹{(bill.total || bill.totalAmount || 0).toFixed(2)}
                      </p>
                      {bill.discount > 0 && (
                        <p style={{fontSize: '11px', color: '#059669', marginTop: '2px'}}>
                          Discount: ₹{bill.discount.toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="billhistory-premium-td">
                      {getStatusBadge(bill.status || 'completed')}
                    </td>
                    <td className="billhistory-premium-td billhistory-premium-td-actions">
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button
                          onClick={() => handleViewBill(bill._id)}
                          className="billhistory-premium-action-btn"
                          title="View Details"
                          style={{background: '#DBEAFE', color: '#1E40AF'}}
                        >
                          <Eye className="billhistory-premium-action-icon" />
                        </button>
                        <button
                          onClick={() => handlePrintBill(bill._id)}
                          className="billhistory-premium-action-btn"
                          title="Print Invoice"
                          style={{background: '#E0E7FF', color: '#4338CA'}}
                        >
                          <Printer className="billhistory-premium-action-icon" />
                        </button>
                        <button
                          onClick={() => handleDownloadBill(bill._id, bill.invoiceNumber)}
                          className="billhistory-premium-action-btn"
                          title="Download Invoice"
                          style={{background: '#D1FAE5', color: '#065F46'}}
                        >
                          <Download className="billhistory-premium-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="billhistory-premium-pagination">
            <div className="billhistory-premium-pagination-mobile">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="billhistory-premium-pagination-btn"
              >
                Previous
              </button>
              <span style={{padding: '0 16px', color: '#6B7280', fontSize: '14px'}}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="billhistory-premium-pagination-btn"
              >
                Next
              </button>
            </div>
            <div className="billhistory-premium-pagination-desktop">
              <div>
                <p className="billhistory-premium-pagination-info">
                  Showing{' '}
                  <span className="billhistory-premium-pagination-number">
                    {(pagination.page - 1) * 10 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="billhistory-premium-pagination-number">
                    {Math.min(pagination.page * 10, pagination.totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="billhistory-premium-pagination-number">{pagination.totalCount}</span>{' '}
                  bills
                </p>
              </div>
              <div>
                <nav className="billhistory-premium-pagination-nav">
                  <button
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                      fetchBills();
                    }}
                    disabled={pagination.page === 1}
                    className="billhistory-premium-pagination-btn billhistory-premium-pagination-btn-left"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }));
                      fetchBills();
                    }}
                    disabled={pagination.page === pagination.totalPages}
                    className="billhistory-premium-pagination-btn billhistory-premium-pagination-btn-right"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillHistory;