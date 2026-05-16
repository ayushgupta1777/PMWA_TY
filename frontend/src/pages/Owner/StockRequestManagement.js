import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Check, X, Clock, 
  AlertCircle, Send, FileText, User, Calendar,
  TrendingUp, Download, Phone, Mail, MessageSquare,
  Truck, CheckCircle, Eye, RefreshCw, ChevronDown,
  MessageCircle, Printer, Share2, Copy, Edit
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import '../../Styling/pages/Owner/StockRequestManagementPremium.css';

const StockRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  status: '',
  urgency: '',
  search: '',
  vendor: ''
});
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    critical: 0,
    uniqueVendors: 0
  });
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalPages: 1
  });
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);
  const [bulkSendData, setBulkSendData] = useState({
    vendorId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
    fetchVendors();
  }, [filters, pagination.page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.search) params.search = filters.search;
      if (filters.vendor) params.vendor = filters.vendor;
      
      console.log('📤 Fetching with params:', params);
      
      const data = await ownerService.getStockRequests(params);

      console.log('📥 Received data:', data);

      setRequests(data.requests || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch stock requests:', error);
      alert('Failed to fetch stock requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await ownerService.getStockRequestStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await ownerService.getVendorsWithRequestCounts();
      console.log('Vendors fetched:', data);
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      setVendors([]);
    }
  };

  // 🔥 FIXED: This is called from modal's "Confirm Order Now" button
  const handleBulkSubmit = async () => {
    if (!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate) {
      alert('Vendor and delivery date are required');
      return;
    }

    try {
      setLoading(true);
      
      const selectedIds = bulkSendData.selectedIds || Array.from(selectedRequests);
      
      if (selectedIds.length === 0) {
        alert('No requests selected');
        return;
      }

      const payload = {
        requestIds: selectedIds,
        vendorId: bulkSendData.vendorId,
        orderDate: bulkSendData.orderDate,
        expectedDeliveryDate: bulkSendData.expectedDeliveryDate,
        notes: bulkSendData.notes || ''
      };

      console.log('📤 Sending bulk order payload:', payload);

      const response = await ownerService.bulkSendToVendor(
        payload.requestIds,
        {
          vendorId: payload.vendorId,
          orderDate: payload.orderDate,
          expectedDeliveryDate: payload.expectedDeliveryDate,
          notes: payload.notes
        }
      );

      console.log('✅ Bulk send response:', response);

      // Clear selections and modal
      setSelectedRequests(new Set());
      setShowBulkSendModal(false);
      setBulkSendData({
        vendorId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        notes: ''
      });
      
      // Clear session storage
      sessionStorage.removeItem('pendingBulkOrder');
      
      // Refresh data
      await fetchRequests();
      await fetchStats();
      
      alert(`Success! ${response.updatedCount || 0} request(s) sent to vendor`);
      
    } catch (error) {
      console.error('❌ Failed to send bulk requests:', error);
      alert('Failed to send bulk requests: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await ownerService.approveStockRequest(requestId);
      await fetchRequests();
      await fetchStats();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request: ' + error.message);
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      await ownerService.rejectStockRequest(requestId, reason);
      await fetchRequests();
      await fetchStats();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request: ' + error.message);
    }
  };

  const handleSendToVendor = async (requestId, vendorData) => {
    try {
      console.log('📤 Sending single request to vendor:', { requestId, vendorData });
      
      await ownerService.sendToVendor(requestId, vendorData);
      
      await fetchRequests();
      setSelectedRequest(null);
      
      alert('✅ Order sent to vendor successfully!');
    } catch (error) {
      console.error('❌ Failed to send to vendor:', error);
      alert('Failed to send to vendor: ' + (error.response?.data?.message || error.message));
    }
  };

  // 🔥 FIXED: This opens the modal with proper data
  const handleBulkSendToVendor = () => {
    if (selectedRequests.size === 0) {
      alert('Please select at least one request');
      return;
    }

    // Get approved requests only
    const selectedRequestsArray = requests.filter(r => 
      selectedRequests.has(r._id) && r.status === 'Approved'
    );

    if (selectedRequestsArray.length === 0) {
      alert('Please select at least one approved request');
      return;
    }

    console.log('Opening bulk send modal with requests:', selectedRequestsArray);

    // Initialize modal with proper data
    setBulkSendData({
      vendorId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      notes: '',
      selectedIds: Array.from(selectedRequests),
      requestsForPreview: selectedRequestsArray
    });

    setShowBulkSendModal(true);
  };

//   useEffect(() => {
//     fetchRequests();
//     fetchStats();
//     fetchVendors();
//   }, [filters, pagination.page]);

//   // const fetchRequests = async () => {
//   //   try {
//   //     setLoading(true);
//   //     const data = await ownerService.getStockRequests({
//   //       page: pagination.page,
//   //       limit: pagination.limit,
//   //       status: filters.status,
//   //       urgency: filters.urgency,
//   //       search: filters.search,
//   //       vendor: filters.vendor
//   //     });

//   //     setRequests(data.requests);
//   //     setPagination(prev => ({
//   //       ...prev,
//   //       totalPages: data.totalPages
//   //     }));
//   //   } catch (error) {
//   //     console.error('Failed to fetch stock requests:', error);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };
// // 16-11-2025
  
// const fetchRequests = async () => {
//   try {
//     setLoading(true);
    
//     // Build query params - only include non-empty values
//     const params = {
//       page: pagination.page,
//       limit: pagination.limit
//     };
    
//     if (filters.status) params.status = filters.status;
//     if (filters.urgency) params.urgency = filters.urgency;
//     if (filters.search) params.search = filters.search;
//     if (filters.vendor) params.vendor = filters.vendor;
    
//     console.log('📤 Fetching with params:', params);
    
//     const data = await ownerService.getStockRequests(params);

//     console.log('📥 Received data:', data);

//     setRequests(data.requests || []);
//     setPagination(prev => ({
//       ...prev,
//       totalPages: data.totalPages || 1
//     }));
//   } catch (error) {
//     console.error('Failed to fetch stock requests:', error);
//     alert('Failed to fetch stock requests: ' + error.message);
//   } finally {
//     setLoading(false);
//   }
// };

// const fetchStats = async () => {
//     try {
//       const data = await ownerService.getStockRequestStats();
//       setStats(data);
//     } catch (error) {
//       console.error('Failed to fetch stats:', error);
//     }
//   };

// const fetchVendors = async () => {
//   try {
//     const data = await ownerService.getVendorsWithRequestCounts();
//     console.log('Vendors fetched:', data);
//     setVendors(data.vendors || []);
//   } catch (error) {
//     console.error('Failed to fetch vendors:', error);
//     setVendors([]);
//   }
// };

// // ADD this new function to handle bulk submit
// // BulkSendModal.js - Fixed to properly handle approved requests
// const handleBulkSubmit = async () => {
//   if (!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate) {
//     alert('Please select vendor and delivery date');
//     return;
//   }

//   try {
//     setLoading(true);

//     const payload = {
//       requestIds: Array.from(selectedRequests),
//       vendorId: bulkSendData.vendorId,
//       orderDate: bulkSendData.orderDate,
//       expectedDeliveryDate: bulkSendData.expectedDeliveryDate,
//       notes: bulkSendData.notes
//     };

//     console.log('Sending payload:', payload);

//     const response = await ownerService.bulkSendToVendor(
//       payload.requestIds,
//       {
//         vendorId: payload.vendorId,
//         orderDate: payload.orderDate,
//         expectedDeliveryDate: payload.expectedDeliveryDate,
//         notes: payload.notes
//       }
//     );

//     if (response.success) {
//       setSelectedRequests(new Set());
//       setShowBulkSendModal(false);
//       fetchRequests();
//       fetchStats();
//       alert('✓ Requests sent to vendor successfully');
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     alert('Failed: ' + error.message);
//   } finally {
//     setLoading(false);
//   }
// };



//   const handleApprove = async (requestId) => {
//     try {
//       await ownerService.approveStockRequest(requestId);
//       fetchRequests();
//       fetchStats();
//       setSelectedRequest(null);
//     } catch (error) {
//       console.error('Failed to approve request:', error);
//     }
//   };

//   const handleReject = async (requestId, reason) => {
//     try {
//       await ownerService.rejectStockRequest(requestId, reason);
//       fetchRequests();
//       fetchStats();
//       setSelectedRequest(null);
//     } catch (error) {
//       console.error('Failed to reject request:', error);
//     }
//   };

//   const handleSendToVendor = async (requestId, vendorData) => {
//     try {
//       await ownerService.sendToVendor(requestId, vendorData);
//       fetchRequests();
//       setSelectedRequest(null);
//     } catch (error) {
//       console.error('Failed to send to vendor:', error);
//     }
//   };

//   // const handleBulkSendToVendor = async () => {
//   //   if (selectedRequests.size === 0) {
//   //     alert('Please select at least one request');
//   //     return;
//   //   }

//   //   if (!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate) {
//   //     alert('Please fill in all required fields');
//   //     return;
//   //   }

//   //   try {
//   //     await ownerService.bulkSendToVendor(
//   //       Array.from(selectedRequests),
//   //       bulkSendData
//   //     );
//   //     setSelectedRequests(new Set());
//   //     setShowBulkSendModal(false);
//   //     fetchRequests();
//   //     fetchStats();
//   //     alert('Requests sent to vendor successfully');
//   //   } catch (error) {
//   //     console.error('Failed to send bulk requests:', error);
//   //     alert('Failed to send bulk requests');
//   //   }
//   // };

// // const handleBulkSendToVendor = async () => {
// //   if (selectedRequests.size === 0) {
// //     alert('Please select at least one request');
// //     return;
// //   }

// //   if (!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate) {
// //     alert('Please fill in all required fields');
// //     return;
// //   }

// //   try {
// //     // Get the actual selected requests for preview
// //     const selectedRequestsArray = requests.filter(r => 
// //       selectedRequests.has(r._id)
// //     );

// //     // Pass to modal for preview
// //     setShowBulkSendModal(true);
// //     setBulkSendData(prev => ({
// //       ...prev,
// //       selectedIds: Array.from(selectedRequests),
// //       requestsForPreview: selectedRequestsArray
// //     }));
// //   } catch (error) {
// //     console.error('Failed to prepare bulk send:', error);
// //     alert('Failed to prepare bulk send');
// //   }
// // };


// const handleBulkSendToVendor = () => {
//   if (selectedRequests.size === 0) {
//     alert('Please select at least one request');
//     return;
//   }

//   // Get approved requests only
//   const selectedRequestsArray = requests.filter(r => 
//     selectedRequests.has(r._id) && r.status === 'Approved'
//   );

//   if (selectedRequestsArray.length === 0) {
//     alert('Please select at least one approved request');
//     return;
//   }

//   console.log('Opening bulk send modal with requests:', selectedRequestsArray);

//   // Initialize modal with proper data
//   setBulkSendData({
//     vendorId: '',
//     orderDate: new Date().toISOString().split('T')[0],
//     expectedDeliveryDate: '',
//     notes: '',
//     selectedIds: Array.from(selectedRequests),
//     requestsForPreview: selectedRequestsArray
//   });

//   setShowBulkSendModal(true);
// };


  const toggleRequestSelection = (requestId) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(requests.map(r => r._id)));
    }
  };

  const approvedSelectedCount = requests.filter(
    r => selectedRequests.has(r._id) && r.status === 'Approved'
  ).length;

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { className: 'stock-premium-badge-pending', icon: Clock },
      'Under Review': { className: 'stock-premium-badge-review', icon: FileText },
      'Approved': { className: 'stock-premium-badge-approved', icon: Check },
      'Rejected': { className: 'stock-premium-badge-rejected', icon: X },
      'Ordered': { className: 'stock-premium-badge-ordered', icon: Send },
      'Received': { className: 'stock-premium-badge-received', icon: Package }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <span className={`stock-premium-badge ${config.className}`}>
        <Icon className="stock-premium-badge-icon" />
        <span>{status}</span>
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      'Critical': 'stock-premium-urgency-critical',
      'High': 'stock-premium-urgency-high',
      'Medium': 'stock-premium-urgency-medium',
      'Low': 'stock-premium-urgency-low'
    };

    const className = urgencyConfig[urgency] || urgencyConfig['Medium'];

    return (
      <span className={`stock-premium-urgency ${className}`}>
        {urgency}
      </span>
    );
  };

  return (
    <div className="stock-premium-container">
      {/* Header */}
      <div className="stock-premium-header">
        <div className="stock-premium-header-content">
          <div className="stock-premium-header-top">
            <div className="stock-premium-header-info">
              <h1 className="stock-premium-title">Stock Request Management</h1>
              <p className="stock-premium-subtitle">
                Review and manage stock requests from workers
              </p>
            </div>
            <div className="stock-premium-header-actions">
              <button
                onClick={fetchRequests}
                className="stock-premium-btn stock-premium-btn-secondary"
              >
                <RefreshCw className="stock-premium-btn-icon" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {/* Export report */}}
                className="stock-premium-btn stock-premium-btn-primary"
              >
                <Download className="stock-premium-btn-icon" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stock-premium-stats">
            <div className="stock-premium-stat-card stock-premium-stat-pending">
              <div className="stock-premium-stat-content">
                <div className="stock-premium-stat-info">
                  <p className="stock-premium-stat-label">Pending</p>
                  <p className="stock-premium-stat-value">{stats.pending}</p>
                </div>
                <Clock className="stock-premium-stat-icon" />
              </div>
            </div>
            <div className="stock-premium-stat-card stock-premium-stat-approved">
              <div className="stock-premium-stat-content">
                <div className="stock-premium-stat-info">
                  <p className="stock-premium-stat-label">Approved</p>
                  <p className="stock-premium-stat-value">{stats.approved}</p>
                </div>
                <Check className="stock-premium-stat-icon" />
              </div>
            </div>
            <div className="stock-premium-stat-card stock-premium-stat-rejected">
              <div className="stock-premium-stat-content">
                <div className="stock-premium-stat-info">
                  <p className="stock-premium-stat-label">Rejected</p>
                  <p className="stock-premium-stat-value">{stats.rejected}</p>
                </div>
                <X className="stock-premium-stat-icon" />
              </div>
            </div>
            <div className="stock-premium-stat-card stock-premium-stat-critical">
              <div className="stock-premium-stat-content">
                <div className="stock-premium-stat-info">
                  <p className="stock-premium-stat-label">Critical</p>
                  <p className="stock-premium-stat-value">{stats.critical}</p>
                </div>
                <AlertCircle className="stock-premium-stat-icon" />
              </div>
            </div>
            <div className="stock-premium-stat-card stock-premium-stat-vendors">
              <div className="stock-premium-stat-content">
                <div className="stock-premium-stat-info">
                  <p className="stock-premium-stat-label">Unique Vendors</p>
                  <p className="stock-premium-stat-value">{stats.uniqueVendors}</p>
                </div>
                <Truck className="stock-premium-stat-icon" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="stock-premium-filters">
            <div className="stock-premium-search-wrapper">
              <Search className="stock-premium-search-icon" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="stock-premium-search-input"
                placeholder="Search requests..."
              />
            </div>

<select
  value={filters.status}
  onChange={(e) => {
    console.log('Status filter changed to:', e.target.value);
    setFilters({ ...filters, status: e.target.value });
  }}
  className="stock-premium-select"
>
  <option value="">All Status</option>
  <option value="Pending">Pending</option>
  <option value="Under Review">Under Review</option>
  <option value="Approved">Approved</option>
  <option value="Rejected">Rejected</option>
  <option value="Ordered">Ordered</option>
  <option value="Received">Received</option>
</select>

            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="stock-premium-select"
            >
              <option value="">All Urgency</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filters.vendor}
              onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
              className="stock-premium-select"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name} ({vendor.approvedRequestCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedRequests.size > 0 && (
            <div className="stock-premium-bulk-actions">
              <span className="stock-premium-bulk-text">
                {selectedRequests.size} selected ({approvedSelectedCount} approved)
              </span>
              {approvedSelectedCount > 0 && (
                <button
                  onClick={() => setShowBulkSendModal(true)}
                  className="stock-premium-bulk-send-btn"
                >
                  <Send className="stock-premium-bulk-send-icon" />
                  Send {approvedSelectedCount} to Vendor
                </button>
              )}
              <button
                onClick={() => setSelectedRequests(new Set())}
                className="stock-premium-bulk-clear-btn"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="stock-premium-main">
        {loading ? (
          <div className="stock-premium-loading">
            <div className="stock-premium-spinner"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="stock-premium-empty">
            <Package className="stock-premium-empty-icon" />
            <h3 className="stock-premium-empty-title">No stock requests found</h3>
            <p className="stock-premium-empty-text">All requests have been processed</p>
          </div>
        ) : (
          <>
            <div className="stock-premium-requests">
              {/* Select All Checkbox */}
              <div className="stock-premium-select-all-row">
                <label className="stock-premium-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedRequests.size === requests.length && requests.length > 0}
                    onChange={toggleSelectAll}
                    className="stock-premium-checkbox-input"
                  />
                  <span>Select All</span>
                </label>
              </div>

              {requests.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  isSelected={selectedRequests.has(request._id)}
                  onToggleSelect={() => toggleRequestSelection(request._id)}
                  onView={() => setSelectedRequest(request)}
                  onApprove={() => handleApprove(request._id)}
                  onReject={() => setSelectedRequest(request)}
                  getStatusBadge={getStatusBadge}
                  getUrgencyBadge={getUrgencyBadge}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="stock-premium-pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="stock-premium-pagination-btn"
                >
                  Previous
                </button>
                <span className="stock-premium-pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="stock-premium-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Detail Modal */}
      {/* {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onSendToVendor={handleSendToVendor}
        />
      )} */}

      {selectedRequest && (
  <RequestDetailModal
    request={selectedRequest}
    vendors={vendors}  // ADD THIS
    onClose={() => setSelectedRequest(null)}
    onApprove={handleApprove}
    onReject={handleReject}
    onSendToVendor={handleSendToVendor}
  />
)}



      {/* Bulk Send Modal */}
      {/* {showBulkSendModal && (
        <BulkSendModal
          selectedCount={approvedSelectedCount}
          vendors={vendors}
          bulkSendData={bulkSendData}
          setBulkSendData={setBulkSendData}
          onSubmit={handleBulkSendToVendor}
          onClose={() => setShowBulkSendModal(false)}
          requests={requests}
          selectedRequests={selectedRequests}
        />
      )} */}

      {/* Bulk Send Modal */}
{showBulkSendModal && (
  <BulkSendModal
    selectedCount={approvedSelectedCount}
    vendors={vendors}
    bulkSendData={bulkSendData}
    setBulkSendData={setBulkSendData}
    onSubmit={handleBulkSubmit}  // 🔥 CHANGED: Now calls handleBulkSubmit
    onClose={() => {
      setShowBulkSendModal(false);
      setBulkSendData({
        vendorId: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        notes: ''
      });
    }}
    requests={requests}
    selectedRequests={selectedRequests}
  />
)}
    </div>
  );
};

// Request Card Component with Checkbox
const RequestCard = ({ 
  request, 
  isSelected, 
  onToggleSelect,
  onView, 
  onApprove, 
  onReject, 
  getStatusBadge, 
  getUrgencyBadge 
}) => {
  return (
    <div className="stock-premium-card">
      <div className="stock-premium-card-checkbox">
        <label>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="stock-premium-checkbox-input"
          />
        </label>
      </div>

      <div className="stock-premium-card-header">
        <h3 className="stock-premium-card-number">
          {request.requestNumber}
        </h3>
        <div className="stock-premium-card-badges">
          {getUrgencyBadge(request.urgencyLevel)}
          {getStatusBadge(request.status)}
        </div>
      </div>

      <div className="stock-premium-card-grid">
        <div className="stock-premium-card-section">
          <p className="stock-premium-card-label">Medicine</p>
          <p className="stock-premium-card-value">{request.tablet?.name || 'N/A'}</p>
          <p className="stock-premium-card-meta">
            {request.tablet?.brand} â€¢ {request.tablet?.company}
          </p>
        </div>

        <div className="stock-premium-card-section">
          <p className="stock-premium-card-label">Requested By</p>
          <div className="stock-premium-card-user">
            <User className="stock-premium-card-user-icon" />
            <span className="stock-premium-card-value">
              {request.requestedBy?.name || 'Unknown'}
            </span>
          </div>
          <p className="stock-premium-card-meta">{request.requestedBy?.employeeId}</p>
        </div>

        <div className="stock-premium-card-section">
          <p className="stock-premium-card-label">Stock Info</p>
          <p className="stock-premium-card-stock">
            <span className="stock-premium-card-stock-current">Current: {request.currentStock}</span>
            <span className="stock-premium-card-stock-arrow">â†‘</span>
            <span className="stock-premium-card-stock-requested">Requested: {request.requestedQuantity}</span>
          </p>
        </div>

        <div className="stock-premium-card-section">
          <p className="stock-premium-card-label">Date</p>
          <div className="stock-premium-card-date">
            <Calendar className="stock-premium-card-date-icon" />
            <span className="stock-premium-card-value">
              {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="stock-premium-card-reason">
        <p className="stock-premium-card-label">Reason</p>
        <p className="stock-premium-card-reason-text">
          {request.reason}
        </p>
      </div>

      {request.estimatedCost && (
        <div className="stock-premium-card-cost">
          <span className="stock-premium-card-cost-label">Estimated Cost:</span>
          <span className="stock-premium-card-cost-value">â‚¹{request.estimatedCost.toLocaleString()}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="stock-premium-card-actions">
        <button
          onClick={onView}
          className="stock-premium-card-btn stock-premium-card-btn-view"
        >
          <Eye className="stock-premium-card-btn-icon" />
          <span>View Details</span>
        </button>
        
        {request.status === 'Pending' && (
          <>
            <button
              onClick={onApprove}
              className="stock-premium-card-btn stock-premium-card-btn-approve"
            >
              <Check className="stock-premium-card-btn-icon" />
              <span>Approve</span>
            </button>
            <button
              onClick={onReject}
              className="stock-premium-card-btn stock-premium-card-btn-reject"
            >
              <X className="stock-premium-card-btn-icon" />
              <span>Reject</span>
            </button>
          </>
        )}

        {request.status === 'Approved' && (
          <button
            onClick={onView}
            className="stock-premium-card-btn stock-premium-card-btn-vendor"
          >
            <Send className="stock-premium-card-btn-icon" />
            <span>Send to Vendor</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Bulk Send Modal Component
// const BulkSendModal = ({ 
//   selectedCount, 
//   vendors, 
//   bulkSendData, 
//   setBulkSendData, 
//   requests,
//   onSubmit, 
//   onClose 
// }) => {
//   const [showMessagePreview, setShowMessagePreview] = useState(false);
//   const [messageContent, setMessageContent] = useState('');
//   const [communicationMethod, setCommunicationMethod] = useState('whatsapp');
//   const [isEditingMessage, setIsEditingMessage] = useState(false);

//   // Get selected request details
//   const getSelectedRequests = () => {
//     if (!bulkSendData.requestsForPreview) {
//       return requests.filter(r => 
//         bulkSendData.selectedIds?.includes(r._id)
//       ) || [];
//     }
//     return bulkSendData.requestsForPreview || [];
//   };

//   // Generate message from selected requests
//   const generateMessage = () => {
//     const selectedReqs = getSelectedRequests();
    
//     if (selectedReqs.length === 0) {
//       return 'No request details available';
//     }

//     let message = 'Stock Order Details\n';
//     message += '=' + '='.repeat(30) + '\n\n';
//     message += `Order Date: ${bulkSendData.orderDate}\n`;
//     message += `Expected Delivery: ${bulkSendData.expectedDeliveryDate}\n\n`;
//     message += 'ITEMS ORDERED:\n';
//     message += '-' + '-'.repeat(30) + '\n';

//     selectedReqs.forEach((req, idx) => {
//       message += `\n${idx + 1}. ${req.tablet?.name || 'Unknown'}\n`;
//       message += `   Brand: ${req.tablet?.brand || 'N/A'}\n`;
//       message += `   Company: ${req.tablet?.company || 'N/A'}\n`;
//       message += `   Quantity: ${req.requestedQuantity} units\n`;
//       message += `   Urgency: ${req.urgencyLevel}\n`;
//       message += `   Est. Cost: ₹${req.estimatedCost || 0}\n`;
//       message += `   Request #: ${req.requestNumber}\n`;
//     });

//     const totalCost = selectedReqs.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
//     message += `\n${'='.repeat(32)}\n`;
//     message += `TOTAL ITEMS: ${selectedReqs.length}\n`;
//     message += `TOTAL COST: ₹${totalCost.toLocaleString()}\n`;
//     message += `${'='.repeat(32)}\n`;

//     if (bulkSendData.notes) {
//       message += `\nSPECIAL INSTRUCTIONS:\n${bulkSendData.notes}\n`;
//     }

//     message += `\nPlease confirm availability and delivery timeline.\nThank you!`;
//     return message;
//   };

//   const handleShowPreview = () => {
//     const msg = generateMessage();
//     console.log('Generated message:', msg);
//     setMessageContent(msg);
//     setShowMessagePreview(true);
//   };

//   const sendViaWhatsApp = () => {
//     const message = encodeURIComponent(messageContent);
//     const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
//     const vendorPhone = vendor?.phone || vendor?.contactPerson?.phone;
    
//     if (!vendorPhone) {
//       alert('No phone number for this vendor');
//       return;
//     }
    
//     const phoneNumber = vendorPhone.replace(/\D/g, '');
//     window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
//   };

//   const sendViaEmail = () => {
//     const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
//     if (!vendor?.email) {
//       alert('No email for this vendor');
//       return;
//     }
//     const subject = encodeURIComponent(`Stock Order - ${selectedCount} Items`);
//     const body = encodeURIComponent(messageContent);
//     window.location.href = `mailto:${vendor.email}?subject=${subject}&body=${body}`;
//   };

//   const sendViaPhone = () => {
//     const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
//     const vendorPhone = vendor?.phone || vendor?.contactPerson?.phone;
//     if (!vendorPhone) {
//       alert('No phone number for this vendor');
//       return;
//     }
//     const phoneNumber = vendorPhone.replace(/\D/g, '');
//     window.open(`tel:+91${phoneNumber}`, '_blank');
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(messageContent);
//     alert('Message copied to clipboard!');
//   };

//   if (showMessagePreview) {
//     return (
//       <div className="stock-premium-modal-overlay">
//         <div className="stock-premium-modal stock-premium-message-preview-modal">
//           <div className="stock-premium-modal-header">
//             <h2 className="stock-premium-modal-title">Message Preview & Send</h2>
//             <button onClick={() => setShowMessagePreview(false)} className="stock-premium-modal-close">
//               <X className="stock-premium-modal-close-icon" />
//             </button>
//           </div>

//           <div className="stock-premium-modal-content">
//             {/* Request Summary */}
//             <div className="stock-premium-request-summary">
//               <h4>Order Summary</h4>
//               <div className="stock-premium-summary-items">
//                 {getSelectedRequests().map((req, idx) => (
//                   <div key={idx} className="stock-premium-summary-item">
//                     <span className="summary-item-number">{idx + 1}</span>
//                     <span className="summary-item-name">{req.tablet?.name}</span>
//                     <span className="summary-item-qty">×{req.requestedQuantity}</span>
//                     <span className="summary-item-cost">₹{req.estimatedCost || 0}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Communication Methods */}
//             <div className="stock-premium-communication-methods">
//               <h3 className="stock-premium-comm-title">Select Communication Method</h3>
//               <div className="stock-premium-comm-buttons">
//                 <button
//                   onClick={() => setCommunicationMethod('whatsapp')}
//                   className={`stock-premium-comm-btn ${communicationMethod === 'whatsapp' ? 'active' : ''}`}
//                 >
//                   <MessageCircle size={20} />
//                   <span>WhatsApp</span>
//                 </button>
//                 <button
//                   onClick={() => setCommunicationMethod('email')}
//                   className={`stock-premium-comm-btn ${communicationMethod === 'email' ? 'active' : ''}`}
//                 >
//                   <Mail size={20} />
//                   <span>Email</span>
//                 </button>
//                 <button
//                   onClick={() => setCommunicationMethod('phone')}
//                   className={`stock-premium-comm-btn ${communicationMethod === 'phone' ? 'active' : ''}`}
//                 >
//                   <Phone size={20} />
//                   <span>Phone</span>
//                 </button>
//               </div>
//             </div>

//             {/* Message Preview */}
//             <div className="stock-premium-message-preview">
//               <div className="stock-premium-preview-header">
//                 <h3 className="stock-premium-preview-title">Message Content</h3>
//                 <button
//                   onClick={() => setIsEditingMessage(!isEditingMessage)}
//                   className="stock-premium-edit-message-btn"
//                 >
//                   <Edit size={16} />
//                   {isEditingMessage ? 'Done' : 'Edit'}
//                 </button>
//               </div>

//               {isEditingMessage ? (
//                 <textarea
//                   value={messageContent}
//                   onChange={(e) => setMessageContent(e.target.value)}
//                   className="stock-premium-message-textarea"
//                   rows={15}
//                 />
//               ) : (
//                 <div className="stock-premium-message-content">
//                   {messageContent.split('\n').map((line, idx) => (
//                     <p key={idx} className="stock-premium-message-line">
//                       {line || '\n'}
//                     </p>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Action Buttons */}
//             <div className="stock-premium-message-actions">
//               <button onClick={copyToClipboard} className="stock-premium-action-btn stock-premium-copy-btn">
//                 <Copy size={16} />
//                 Copy Message
//               </button>

//               {communicationMethod === 'whatsapp' && (
//                 <button onClick={sendViaWhatsApp} className="stock-premium-action-btn stock-premium-whatsapp-btn">
//                   <MessageCircle size={16} />
//                   Send via WhatsApp
//                 </button>
//               )}

//               {communicationMethod === 'email' && (
//                 <button onClick={sendViaEmail} className="stock-premium-action-btn stock-premium-email-btn">
//                   <Mail size={16} />
//                   Send via Email
//                 </button>
//               )}

//               {communicationMethod === 'phone' && (
//                 <button onClick={sendViaPhone} className="stock-premium-action-btn stock-premium-phone-btn">
//                   <Phone size={16} />
//                   Call Vendor
//                 </button>
//               )}

//               <button
//                 onClick={() => {
//                   onSubmit();
//                   setShowMessagePreview(false);
//                 }}
//                 className="stock-premium-action-btn stock-premium-confirm-btn"
//               >
//                 <Send size={16} />
//                 Confirm & Save Order
//               </button>

//               <button
//                 onClick={() => setShowMessagePreview(false)}
//                 className="stock-premium-action-btn stock-premium-cancel-btn"
//               >
//                 Back
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Main Modal
//   const selectedVendor = vendors.find(v => v._id === bulkSendData.vendorId);

//   return (
//     <div className="stock-premium-modal-overlay">
//       <div className="stock-premium-modal">
//         <div className="stock-premium-modal-header">
//           <h2 className="stock-premium-modal-title">Send {selectedCount} Request(s) to Vendor</h2>
//           <button onClick={onClose} className="stock-premium-modal-close">
//             <X className="stock-premium-modal-close-icon" />
//           </button>
//         </div>

//         <div className="stock-premium-modal-content">
//           <div className="stock-premium-bulk-info">
//             Sending {selectedCount} approved request{selectedCount !== 1 ? 's' : ''} to vendor
//           </div>

//           <div className="stock-premium-modal-form">
//             <div className="stock-premium-modal-form-group">
//               <label className="stock-premium-modal-form-label">Vendor *</label>
//               <select
//                 value={bulkSendData.vendorId}
//                 onChange={(e) => setBulkSendData({ ...bulkSendData, vendorId: e.target.value })}
//                 className="stock-premium-modal-select"
//               >
//                 <option value="">Select Vendor</option>
//                 {vendors && vendors.map(vendor => (
//                   <option key={vendor._id} value={vendor._id}>
//                     {vendor.name} - {vendor.company} ({vendor.approvedRequestCount || 0} pending)
//                   </option>
//                 ))}
//               </select>
//               {selectedVendor && (
//                 <p className="stock-premium-vendor-info">
//                   📞 {selectedVendor.phone} | 📧 {selectedVendor.email}
//                 </p>
//               )}
//             </div>

//             <div className="stock-premium-modal-date-grid">
//               <div className="stock-premium-modal-form-group">
//                 <label className="stock-premium-modal-form-label">Order Date</label>
//                 <input
//                   type="date"
//                   value={bulkSendData.orderDate}
//                   onChange={(e) => setBulkSendData({ ...bulkSendData, orderDate: e.target.value })}
//                   className="stock-premium-modal-input"
//                 />
//               </div>
//               <div className="stock-premium-modal-form-group">
//                 <label className="stock-premium-modal-form-label">Expected Delivery *</label>
//                 <input
//                   type="date"
//                   value={bulkSendData.expectedDeliveryDate}
//                   onChange={(e) => setBulkSendData({ ...bulkSendData, expectedDeliveryDate: e.target.value })}
//                   className="stock-premium-modal-input"
//                 />
//               </div>
//             </div>

//             <div className="stock-premium-modal-form-group">
//               <label className="stock-premium-modal-form-label">Special Instructions (Optional)</label>
//               <textarea
//                 value={bulkSendData.notes}
//                 onChange={(e) => setBulkSendData({ ...bulkSendData, notes: e.target.value })}
//                 rows="3"
//                 className="stock-premium-modal-textarea"
//                 placeholder="e.g., Rush delivery, Special packaging, etc."
//               />
//             </div>
//           </div>

//           <div className="stock-premium-modal-actions">
//             <button onClick={onClose} className="stock-premium-modal-btn stock-premium-modal-btn-cancel">
//               Cancel
//             </button>
//             <button
//               onClick={handleShowPreview}
//               disabled={!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate}
//               className="stock-premium-modal-btn stock-premium-modal-btn-preview"
//             >
//               <Eye size={16} />
//               Preview & Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const BulkSendModal = ({ 
//   selectedCount, 
//   vendors, 
//   bulkSendData, 
//   setBulkSendData, 
//   requests,
//   selectedRequests,
//   onSubmit, 
//   onClose 
// }) => {
//   const [showMessagePreview, setShowMessagePreview] = useState(false);
//   const [messageContent, setMessageContent] = useState('');
//   const [communicationMethod, setCommunicationMethod] = useState('whatsapp');
//   const [isEditingMessage, setIsEditingMessage] = useState(false);

//   // Get selected request details - FIXED
//   const getSelectedRequests = () => {
//     return requests.filter(r => 
//       selectedRequests.has(r._id) && r.status === 'Approved'
//     );
//   };

//   // Generate message - FIXED
//   const generateMessage = () => {
//     const selectedReqs = getSelectedRequests();
    
//     if (selectedReqs.length === 0) {
//       return 'No approved requests selected';
//     }

//     const selectedVendor = vendors.find(v => v._id === bulkSendData.vendorId);
    
//     let message = `Dear ${selectedVendor?.name || 'Vendor'},\n\n`;
//     message += 'Stock Order Details\n';
//     message += '='.repeat(40) + '\n\n';
//     message += `Order Date: ${new Date(bulkSendData.orderDate).toLocaleDateString('en-IN')}\n`;
//     message += `Expected Delivery: ${new Date(bulkSendData.expectedDeliveryDate).toLocaleDateString('en-IN')}\n\n`;
//     message += 'ITEMS ORDERED:\n';
//     message += '-'.repeat(40) + '\n';

//     let totalCost = 0;
//     selectedReqs.forEach((req, idx) => {
//       message += `\n${idx + 1}. ${req.tablet?.name || 'Unknown Medicine'}\n`;
//       message += `   Brand: ${req.tablet?.brand || 'N/A'}\n`;
//       message += `   Company: ${req.tablet?.company || 'N/A'}\n`;
//       message += `   Quantity: ${req.requestedQuantity} units\n`;
//       message += `   Urgency: ${req.urgencyLevel}\n`;
//       const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
//       message += `   Est. Cost: ₹${cost.toLocaleString('en-IN')}\n`;
//       message += `   Request #: ${req.requestNumber}\n`;
//       totalCost += cost;
//     });

//     message += `\n${'='.repeat(40)}\n`;
//     message += `TOTAL ITEMS: ${selectedReqs.length}\n`;
//     message += `TOTAL ESTIMATED COST: ₹${totalCost.toLocaleString('en-IN')}\n`;
//     message += `${'='.repeat(40)}\n`;

//     if (bulkSendData.notes) {
//       message += `\nSPECIAL INSTRUCTIONS:\n${bulkSendData.notes}\n\n`;
//     }

//     message += `\nPlease confirm availability and delivery timeline.\n`;
//     message += `\nBest Regards,\nPharmaCare Management`;
    
//     return message;
//   };

//   const handleShowPreview = () => {
//     if (!bulkSendData.vendorId) {
//       alert('Please select a vendor first');
//       return;
//     }
//     const msg = generateMessage();
//     setMessageContent(msg);
//     setShowMessagePreview(true);
//   };

//   const sendViaWhatsApp = () => {
//     const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
//     const vendorPhone = vendor?.phone || vendor?.contactPerson?.phone;
    
//     if (!vendorPhone) {
//       alert('No phone number available for this vendor');
//       return;
//     }
    
//     const phoneNumber = vendorPhone.replace(/\D/g, '');
//     const message = encodeURIComponent(messageContent);
//     window.open(`https://wa.me/91${phoneNumber}?text=${message}`, '_blank');
//   };

//   const sendViaEmail = () => {
//     const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
//     if (!vendor?.email) {
//       alert('No email available for this vendor');
//       return;
//     }
//     const subject = encodeURIComponent(`Stock Order - ${selectedCount} Items`);
//     const body = encodeURIComponent(messageContent);
//     window.location.href = `mailto:${vendor.email}?subject=${subject}&body=${body}`;
//   };

//   const sendViaPhone = () => {
//     const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
//     const vendorPhone = vendor?.phone || vendor?.contactPerson?.phone;
//     if (!vendorPhone) {
//       alert('No phone number available for this vendor');
//       return;
//     }
//     const phoneNumber = vendorPhone.replace(/\D/g, '');
//     window.open(`tel:+91${phoneNumber}`);
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(messageContent);
//     alert('Message copied to clipboard!');
//   };

//   if (showMessagePreview) {
//     const selectedReqs = getSelectedRequests();
    
//     return (
//       <div className="stock-premium-modal-overlay">
//         <div className="stock-premium-modal stock-premium-message-preview-modal">
//           <div className="stock-premium-modal-header">
//             <h2 className="stock-premium-modal-title">Message Preview & Send</h2>
//             <button onClick={() => setShowMessagePreview(false)} className="stock-premium-modal-close">
//               <X className="stock-premium-modal-close-icon" />
//             </button>
//           </div>

//           <div className="stock-premium-modal-content">
//             {/* Request Summary - FIXED */}
//             <div className="stock-premium-request-summary">
//               <h4>Order Summary ({selectedReqs.length} items)</h4>
//               <div className="stock-premium-summary-items">
//                 {selectedReqs.map((req, idx) => {
//                   const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
//                   return (
//                     <div key={req._id} className="stock-premium-summary-item">
//                       <span className="summary-item-number">{idx + 1}</span>
//                       <span className="summary-item-name">{req.tablet?.name}</span>
//                       <span className="summary-item-qty">×{req.requestedQuantity}</span>
//                       <span className="summary-item-cost">₹{cost.toLocaleString('en-IN')}</span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Communication Methods */}
//             <div className="stock-premium-communication-methods">
//               <h3 className="stock-premium-comm-title">Select Communication Method</h3>
//               <div className="stock-premium-comm-buttons">
//                 <button
//                   onClick={() => setCommunicationMethod('whatsapp')}
//                   className={`stock-premium-comm-btn ${communicationMethod === 'whatsapp' ? 'active' : ''}`}
//                 >
//                   <MessageCircle size={20} />
//                   <span>WhatsApp</span>
//                 </button>
//                 <button
//                   onClick={() => setCommunicationMethod('email')}
//                   className={`stock-premium-comm-btn ${communicationMethod === 'email' ? 'active' : ''}`}
//                 >
//                   <Mail size={20} />
//                   <span>Email</span>
//                 </button>
//                 <button
//                   onClick={() => setCommunicationMethod('phone')}
//                   className={`stock-premium-comm-btn ${communicationMethod === 'phone' ? 'active' : ''}`}
//                 >
//                   <Phone size={20} />
//                   <span>Phone</span>
//                 </button>
//               </div>
//             </div>

//             {/* Message Preview */}
//             <div className="stock-premium-message-preview">
//               <div className="stock-premium-preview-header">
//                 <h3 className="stock-premium-preview-title">Message Content</h3>
//                 <button
//                   onClick={() => setIsEditingMessage(!isEditingMessage)}
//                   className="stock-premium-edit-message-btn"
//                 >
//                   <Edit size={16} />
//                   {isEditingMessage ? 'Done' : 'Edit'}
//                 </button>
//               </div>

//               {isEditingMessage ? (
//                 <textarea
//                   value={messageContent}
//                   onChange={(e) => setMessageContent(e.target.value)}
//                   className="stock-premium-message-textarea"
//                   rows={15}
//                 />
//               ) : (
//                 <div className="stock-premium-message-content">
//                   {messageContent.split('\n').map((line, idx) => (
//                     <p key={idx} className="stock-premium-message-line">
//                       {line || <br />}
//                     </p>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Action Buttons */}
//             <div className="stock-premium-message-actions">
//               <button onClick={copyToClipboard} className="stock-premium-action-btn stock-premium-copy-btn">
//                 <Copy size={16} />
//                 Copy Message
//               </button>

//               {communicationMethod === 'whatsapp' && (
//                 <button onClick={sendViaWhatsApp} className="stock-premium-action-btn stock-premium-whatsapp-btn">
//                   <MessageCircle size={16} />
//                   Send via WhatsApp
//                 </button>
//               )}

//               {communicationMethod === 'email' && (
//                 <button onClick={sendViaEmail} className="stock-premium-action-btn stock-premium-email-btn">
//                   <Mail size={16} />
//                   Send via Email
//                 </button>
//               )}

//               {communicationMethod === 'phone' && (
//                 <button onClick={sendViaPhone} className="stock-premium-action-btn stock-premium-phone-btn">
//                   <Phone size={16} />
//                   Call Vendor
//                 </button>
//               )}

//               <button
//                 onClick={() => {
//                   setShowMessagePreview(false);
//                   onSubmit();
//                 }}
//                 className="stock-premium-action-btn stock-premium-confirm-btn"
//               >
//                 <Send size={16} />
//                 Confirm & Save Order
//               </button>

//               <button
//                 onClick={() => setShowMessagePreview(false)}
//                 className="stock-premium-action-btn stock-premium-cancel-btn"
//               >
//                 Back
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Main Modal
//   const selectedVendor = vendors.find(v => v._id === bulkSendData.vendorId);

//   return (
//     <div className="stock-premium-modal-overlay">
//       <div className="stock-premium-modal">
//         <div className="stock-premium-modal-header">
//           <h2 className="stock-premium-modal-title">Send {selectedCount} Request(s) to Vendor</h2>
//           <button onClick={onClose} className="stock-premium-modal-close">
//             <X className="stock-premium-modal-close-icon" />
//           </button>
//         </div>

//         <div className="stock-premium-modal-content">
//           <div className="stock-premium-bulk-info">
//             Sending {selectedCount} approved request{selectedCount !== 1 ? 's' : ''} to vendor
//           </div>

//           <div className="stock-premium-modal-form">
//             <div className="stock-premium-modal-form-group">
//               <label className="stock-premium-modal-form-label">Vendor *</label>
//               <select
//                 value={bulkSendData.vendorId}
//                 onChange={(e) => setBulkSendData({ ...bulkSendData, vendorId: e.target.value })}
//                 className="stock-premium-modal-select"
//               >
//                 <option value="">Select Vendor</option>
//                 {vendors.map(vendor => (
//                   <option key={vendor._id} value={vendor._id}>
//                     {vendor.name} - {vendor.company} 
//                     {vendor.approvedRequestCount > 0 && ` (${vendor.approvedRequestCount} pending)`}
//                   </option>
//                 ))}
//               </select>
//               {selectedVendor && (
//                 <p className="stock-premium-vendor-info">
//                   📞 {selectedVendor.phone} | 📧 {selectedVendor.email}
//                 </p>
//               )}
//             </div>

//             <div className="stock-premium-modal-date-grid">
//               <div className="stock-premium-modal-form-group">
//                 <label className="stock-premium-modal-form-label">Order Date</label>
//                 <input
//                   type="date"
//                   value={bulkSendData.orderDate}
//                   onChange={(e) => setBulkSendData({ ...bulkSendData, orderDate: e.target.value })}
//                   className="stock-premium-modal-input"
//                 />
//               </div>
//               <div className="stock-premium-modal-form-group">
//                 <label className="stock-premium-modal-form-label">Expected Delivery *</label>
//                 <input
//                   type="date"
//                   value={bulkSendData.expectedDeliveryDate}
//                   onChange={(e) => setBulkSendData({ ...bulkSendData, expectedDeliveryDate: e.target.value })}
//                   className="stock-premium-modal-input"
//                   min={new Date().toISOString().split('T')[0]}
//                 />
//               </div>
//             </div>

//             <div className="stock-premium-modal-form-group">
//               <label className="stock-premium-modal-form-label">Special Instructions (Optional)</label>
//               <textarea
//                 value={bulkSendData.notes}
//                 onChange={(e) => setBulkSendData({ ...bulkSendData, notes: e.target.value })}
//                 rows="3"
//                 className="stock-premium-modal-textarea"
//                 placeholder="e.g., Rush delivery, Special packaging, etc."
//               />
//             </div>
//           </div>

//           <div className="stock-premium-modal-actions">
//             <button onClick={onClose} className="stock-premium-modal-btn stock-premium-modal-btn-cancel">
//               Cancel
//             </button>
//             <button
//               onClick={handleShowPreview}
//               disabled={!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate}
//               className="stock-premium-modal-btn stock-premium-modal-btn-preview"
//             >
//               <Eye size={16} />
//               Preview & Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };  
// --16-11-2025

const BulkSendModal = ({ 
  selectedCount, 
  vendors, 
  bulkSendData, 
  setBulkSendData, 
  requests,
  selectedRequests,
  onSubmit, 
  onClose 
}) => {
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [communicationMethod, setCommunicationMethod] = useState('whatsapp');
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  // 🔥 SAVE STATE TO SESSION STORAGE
  useEffect(() => {
    if (showMessagePreview && bulkSendData.vendorId) {
      const stateToSave = {
        vendorId: bulkSendData.vendorId,
        orderDate: bulkSendData.orderDate,
        expectedDeliveryDate: bulkSendData.expectedDeliveryDate,
        notes: bulkSendData.notes,
        selectedIds: bulkSendData.selectedIds,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pendingBulkOrder', JSON.stringify(stateToSave));
      console.log('💾 Saved pending order to session storage');
    }
  }, [showMessagePreview, bulkSendData]);

  // 🔥 RESTORE STATE ON MOUNT
  useEffect(() => {
    const savedState = sessionStorage.getItem('pendingBulkOrder');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Only restore if less than 30 minutes old
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        console.log('♻️ Restoring saved order state');
        setBulkSendData(prev => ({
          ...prev,
          ...parsed
        }));
      }
    }
  }, []);

  // Get selected request details
  const getSelectedRequests = () => {
    return requests.filter(r => 
      selectedRequests.has(r._id) && r.status === 'Approved'
    );
  };

  // Generate message
  const generateMessage = () => {
    const selectedReqs = getSelectedRequests();
    
    if (selectedReqs.length === 0) {
      return 'No approved requests selected';
    }

    const selectedVendor = vendors.find(v => v._id === bulkSendData.vendorId);
    
    let message = `Dear ${selectedVendor?.name || 'Vendor'},\n\n`;
    message += 'Stock Order Details\n';
    message += '='.repeat(40) + '\n\n';
    message += `Order Date: ${new Date(bulkSendData.orderDate).toLocaleDateString('en-IN')}\n`;
    message += `Expected Delivery: ${new Date(bulkSendData.expectedDeliveryDate).toLocaleDateString('en-IN')}\n\n`;
    message += 'ITEMS ORDERED:\n';
    message += '-'.repeat(40) + '\n';

    let totalCost = 0;
    selectedReqs.forEach((req, idx) => {
      message += `\n${idx + 1}. ${req.tablet?.name || 'Unknown Medicine'}\n`;
      message += `   Brand: ${req.tablet?.brand || 'N/A'}\n`;
      message += `   Company: ${req.tablet?.company || 'N/A'}\n`;
      message += `   Quantity: ${req.requestedQuantity} units\n`;
      message += `   Urgency: ${req.urgencyLevel}\n`;
      const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
      message += `   Est. Cost: ₹${cost.toLocaleString('en-IN')}\n`;
      message += `   Request #: ${req.requestNumber}\n`;
      totalCost += cost;
    });

    message += `\n${'='.repeat(40)}\n`;
    message += `TOTAL ITEMS: ${selectedReqs.length}\n`;
    message += `TOTAL ESTIMATED COST: ₹${totalCost.toLocaleString('en-IN')}\n`;
    message += `${'='.repeat(40)}\n`;

    if (bulkSendData.notes) {
      message += `\nSPECIAL INSTRUCTIONS:\n${bulkSendData.notes}\n\n`;
    }

    message += `\nPlease confirm availability and delivery timeline.\n`;
    message += `\nBest Regards,\nPharmaCare Management`;
    
    return message;
  };

  const handleShowPreview = () => {
    if (!bulkSendData.vendorId) {
      alert('Please select a vendor first');
      return;
    }
    if (!bulkSendData.expectedDeliveryDate) {
      alert('Please select expected delivery date');
      return;
    }
    const msg = generateMessage();
    setMessageContent(msg);
    setShowMessagePreview(true);
  };

  const sendViaWhatsApp = () => {
    const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
    const vendorPhone = vendor?.phone || vendor?.contactPerson?.phone;
    
    if (!vendorPhone) {
      alert('No phone number available for this vendor');
      return;
    }
    
    const phoneNumber = vendorPhone.replace(/\D/g, '');
    const message = encodeURIComponent(messageContent);
    
    // Mark as sent but don't close modal
    console.log('📱 Opening WhatsApp...');
    window.open(`https://wa.me/91${phoneNumber}?text=${message}`, '_blank');
    
    // Show confirmation prompt after 2 seconds
    setTimeout(() => {
      if (window.confirm('Message sent via WhatsApp. Do you want to confirm the order in the system now?')) {
        handleConfirmOrder();
      }
    }, 2000);
  };

  const sendViaEmail = () => {
    const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
    if (!vendor?.email) {
      alert('No email available for this vendor');
      return;
    }
    const subject = encodeURIComponent(`Stock Order - ${selectedCount} Items`);
    const body = encodeURIComponent(messageContent);
    window.location.href = `mailto:${vendor.email}?subject=${subject}&body=${body}`;
    
    setTimeout(() => {
      if (window.confirm('Email client opened. Do you want to confirm the order in the system now?')) {
        handleConfirmOrder();
      }
    }, 2000);
  };

  const sendViaPhone = () => {
    const vendor = vendors.find(v => v._id === bulkSendData.vendorId);
    const vendorPhone = vendor?.phone || vendor?.contactPerson?.phone;
    if (!vendorPhone) {
      alert('No phone number available for this vendor');
      return;
    }
    const phoneNumber = vendorPhone.replace(/\D/g, '');
    window.open(`tel:+91${phoneNumber}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageContent);
    alert('Message copied to clipboard!');
  };

  // 🔥 NEW: Handle confirm order
  const handleConfirmOrder = async () => {
    try {
      console.log('🔄 Confirming order...');
      await onSubmit();
      
      // Clear session storage after successful submit
      sessionStorage.removeItem('pendingBulkOrder');
      console.log('✅ Order confirmed and session cleared');
      
      setShowMessagePreview(false);
    } catch (error) {
      console.error('❌ Failed to confirm order:', error);
      alert('Failed to confirm order: ' + error.message);
    }
  };

  if (showMessagePreview) {
    const selectedReqs = getSelectedRequests();
    
    return (
      <div className="stock-premium-modal-overlay">
        <div className="stock-premium-modal stock-premium-message-preview-modal">
          <div className="stock-premium-modal-header">
            <h2 className="stock-premium-modal-title">Message Preview & Send</h2>
            <button onClick={() => setShowMessagePreview(false)} className="stock-premium-modal-close">
              <X className="stock-premium-modal-close-icon" />
            </button>
          </div>

          <div className="stock-premium-modal-content">
            {/* Request Summary */}
            <div className="stock-premium-request-summary">
              <h4>Order Summary ({selectedReqs.length} items)</h4>
              <div className="stock-premium-summary-items">
                {selectedReqs.map((req, idx) => {
                  const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
                  return (
                    <div key={req._id} className="stock-premium-summary-item">
                      <span className="summary-item-number">{idx + 1}</span>
                      <span className="summary-item-name">{req.tablet?.name}</span>
                      <span className="summary-item-qty">×{req.requestedQuantity}</span>
                      <span className="summary-item-cost">₹{cost.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Communication Methods */}
            <div className="stock-premium-communication-methods">
              <h3 className="stock-premium-comm-title">Select Communication Method</h3>
              <div className="stock-premium-comm-buttons">
                <button
                  onClick={() => setCommunicationMethod('whatsapp')}
                  className={`stock-premium-comm-btn ${communicationMethod === 'whatsapp' ? 'active' : ''}`}
                >
                  <MessageCircle size={20} />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setCommunicationMethod('email')}
                  className={`stock-premium-comm-btn ${communicationMethod === 'email' ? 'active' : ''}`}
                >
                  <Mail size={20} />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => setCommunicationMethod('phone')}
                  className={`stock-premium-comm-btn ${communicationMethod === 'phone' ? 'active' : ''}`}
                >
                  <Phone size={20} />
                  <span>Phone</span>
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div className="stock-premium-message-preview">
              <div className="stock-premium-preview-header">
                <h3 className="stock-premium-preview-title">Message Content</h3>
                <button
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="stock-premium-edit-message-btn"
                >
                  <Edit size={16} />
                  {isEditingMessage ? 'Done' : 'Edit'}
                </button>
              </div>

              {isEditingMessage ? (
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="stock-premium-message-textarea"
                  rows={15}
                />
              ) : (
                <div className="stock-premium-message-content">
                  {messageContent.split('\n').map((line, idx) => (
                    <p key={idx} className="stock-premium-message-line">
                      {line || <br />}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons - UPDATED */}
            <div className="stock-premium-message-actions">
              <button onClick={copyToClipboard} className="stock-premium-action-btn stock-premium-copy-btn">
                <Copy size={16} />
                Copy Message
              </button>

              {communicationMethod === 'whatsapp' && (
                <button onClick={sendViaWhatsApp} className="stock-premium-action-btn stock-premium-whatsapp-btn">
                  <MessageCircle size={16} />
                  Send via WhatsApp
                </button>
              )}

              {communicationMethod === 'email' && (
                <button onClick={sendViaEmail} className="stock-premium-action-btn stock-premium-email-btn">
                  <Mail size={16} />
                  Send via Email
                </button>
              )}

              {communicationMethod === 'phone' && (
                <button onClick={sendViaPhone} className="stock-premium-action-btn stock-premium-phone-btn">
                  <Phone size={16} />
                  Call Vendor
                </button>
              )}

              {/* 🔥 DIRECT CONFIRM BUTTON */}
              <button
                onClick={handleConfirmOrder}
                className="stock-premium-action-btn stock-premium-confirm-btn"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                <Send size={16} />
                Confirm Order Now
              </button>

              <button
                onClick={() => setShowMessagePreview(false)}
                className="stock-premium-action-btn stock-premium-cancel-btn"
              >
                Back
              </button>
            </div>

            {/* 🔥 INFO MESSAGE */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <strong>💡 Tip:</strong> After sending the message via WhatsApp/Email, come back and click "Confirm Order Now" to save it in the system.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Modal - unchanged
  const selectedVendor = vendors.find(v => v._id === bulkSendData.vendorId);

  return (
    <div className="stock-premium-modal-overlay">
      <div className="stock-premium-modal">
        <div className="stock-premium-modal-header">
          <h2 className="stock-premium-modal-title">Send {selectedCount} Request(s) to Vendor</h2>
          <button onClick={onClose} className="stock-premium-modal-close">
            <X className="stock-premium-modal-close-icon" />
          </button>
        </div>

        <div className="stock-premium-modal-content">
          <div className="stock-premium-bulk-info">
            Sending {selectedCount} approved request{selectedCount !== 1 ? 's' : ''} to vendor
          </div>

          <div className="stock-premium-modal-form">
            <div className="stock-premium-modal-form-group">
              <label className="stock-premium-modal-form-label">Vendor *</label>
              <select
                value={bulkSendData.vendorId}
                onChange={(e) => setBulkSendData({ ...bulkSendData, vendorId: e.target.value })}
                className="stock-premium-modal-select"
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name} - {vendor.company} 
                    {vendor.approvedRequestCount > 0 && ` (${vendor.approvedRequestCount} pending)`}
                  </option>
                ))}
              </select>
              {selectedVendor && (
                <p className="stock-premium-vendor-info">
                  📞 {selectedVendor.phone} | 📧 {selectedVendor.email}
                </p>
              )}
            </div>

            <div className="stock-premium-modal-date-grid">
              <div className="stock-premium-modal-form-group">
                <label className="stock-premium-modal-form-label">Order Date</label>
                <input
                  type="date"
                  value={bulkSendData.orderDate}
                  onChange={(e) => setBulkSendData({ ...bulkSendData, orderDate: e.target.value })}
                  className="stock-premium-modal-input"
                />
              </div>
              <div className="stock-premium-modal-form-group">
                <label className="stock-premium-modal-form-label">Expected Delivery *</label>
                <input
                  type="date"
                  value={bulkSendData.expectedDeliveryDate}
                  onChange={(e) => setBulkSendData({ ...bulkSendData, expectedDeliveryDate: e.target.value })}
                  className="stock-premium-modal-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="stock-premium-modal-form-group">
              <label className="stock-premium-modal-form-label">Special Instructions (Optional)</label>
              <textarea
                value={bulkSendData.notes}
                onChange={(e) => setBulkSendData({ ...bulkSendData, notes: e.target.value })}
                rows="3"
                className="stock-premium-modal-textarea"
                placeholder="e.g., Rush delivery, Special packaging, etc."
              />
            </div>
          </div>

          <div className="stock-premium-modal-actions">
            <button onClick={onClose} className="stock-premium-modal-btn stock-premium-modal-btn-cancel">
              Cancel
            </button>
            <button
              onClick={handleShowPreview}
              disabled={!bulkSendData.vendorId || !bulkSendData.expectedDeliveryDate}
              className="stock-premium-modal-btn stock-premium-modal-btn-preview"
            >
              <Eye size={16} />
              Preview & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Enhanced Request Detail Modal Component (keep existing one, no changes needed)
const RequestDetailModal = ({ request, vendors, onClose, onApprove, onReject, onSendToVendor }) => {
  // ... rest of the code
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [vendorData, setVendorData] = useState({
    vendorId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
    communicationMethod: 'whatsapp',
    sendQuotation: true,
    priority: 'normal'
  });

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(request._id, rejectReason);
    }
  };

  // const handleSendToVendor = () => {
  //   if (vendorData.vendorId && vendorData.expectedDeliveryDate) {
  //     onSendToVendor(request._id, vendorData);
  //   }
  // };


  const handleSendToVendor = async () => {
  if (!vendorData.vendorId || !vendorData.expectedDeliveryDate) {
    alert('Please select vendor and expected delivery date');
    return;
  }

  try {
    console.log('Sending single request to vendor:', {
      requestId: request._id,
      vendorData
    });

    await onSendToVendor(request._id, vendorData);
    alert('Order sent to vendor successfully!');
  } catch (error) {
    console.error('Send to vendor error:', error);
    alert('Failed to send to vendor: ' + (error.response?.data?.message || error.message));
  }
};

  const generateWhatsAppMessage = () => {
    return `Hello! 
    
Stock Request Details:
Request No: ${request.requestNumber}
Medicine: ${request.tablet?.name}
Brand: ${request.tablet?.brand}
Quantity: ${request.requestedQuantity} units
Estimated Cost: â‚¹${request.estimatedCost}

Please confirm availability and quote.

Thank you!`;
  };

  const sendViaWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppMessage());
    const phone = '1234567890';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const sendViaEmail = () => {
    const subject = encodeURIComponent(`Stock Request - ${request.requestNumber}`);
    const body = encodeURIComponent(generateWhatsAppMessage());
    window.location.href = `mailto:vendor@example.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="stock-premium-modal-overlay">
      <div className="stock-premium-modal">
        <div className="stock-premium-modal-header">
          <h2 className="stock-premium-modal-title">Request Details</h2>
          <button onClick={onClose} className="stock-premium-modal-close">
            <X className="stock-premium-modal-close-icon" />
          </button>
        </div>

        <div className="stock-premium-modal-content">
          {/* Request Info */}
          <div className="stock-premium-modal-grid">
            <div className="stock-premium-modal-field">
              <label className="stock-premium-modal-label">Request Number</label>
              <p className="stock-premium-modal-value">{request.requestNumber}</p>
            </div>
            <div className="stock-premium-modal-field">
              <label className="stock-premium-modal-label">Status</label>
              <p className="stock-premium-modal-value">{request.status}</p>
            </div>
            <div className="stock-premium-modal-field">
              <label className="stock-premium-modal-label">Urgency</label>
              <p className="stock-premium-modal-value stock-premium-modal-value-urgency">{request.urgencyLevel}</p>
            </div>
            <div className="stock-premium-modal-field">
              <label className="stock-premium-modal-label">Current Stock</label>
              <p className="stock-premium-modal-value stock-premium-modal-value-danger">{request.currentStock}</p>
            </div>
            <div className="stock-premium-modal-field">
              <label className="stock-premium-modal-label">Requested Quantity</label>
              <p className="stock-premium-modal-value stock-premium-modal-value-success">{request.requestedQuantity}</p>
            </div>
            {request.estimatedCost && (
              <div className="stock-premium-modal-field">
                <label className="stock-premium-modal-label">Estimated Cost</label>
                <p className="stock-premium-modal-value stock-premium-modal-value-success">â‚¹{request.estimatedCost.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Medicine Details */}
          <div className="stock-premium-modal-section stock-premium-modal-section-medicine">
            <h3 className="stock-premium-modal-section-title">
              <Package className="stock-premium-modal-section-icon" />
              Medicine Details
            </h3>
            <p className="stock-premium-modal-medicine-name">{request.tablet?.name}</p>
            <p className="stock-premium-modal-medicine-meta">{request.tablet?.brand} â€¢ {request.tablet?.company}</p>
          </div>

          {/* Reason */}
          <div className="stock-premium-modal-section">
            <h3 className="stock-premium-modal-section-title">Request Reason</h3>
            <p className="stock-premium-modal-reason">{request.reason}</p>
          </div>

          {/* Worker Info */}
          <div className="stock-premium-modal-section stock-premium-modal-section-worker">
            <h3 className="stock-premium-modal-section-title">
              <User className="stock-premium-modal-section-icon" />
              Requested By
            </h3>
            <p className="stock-premium-modal-worker-name">{request.requestedBy?.name}</p>
            <p className="stock-premium-modal-worker-meta">{request.requestedBy?.employeeId} â€¢ {request.requestedBy?.department}</p>
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="stock-premium-modal-form stock-premium-modal-form-reject">
              <label className="stock-premium-modal-form-label">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="3"
                className="stock-premium-modal-textarea"
                placeholder="Explain why this request is being rejected..."
              />
            </div>
          )}

          {/* Vendor Form */}
          {/* {showVendorForm && (
            <div className="stock-premium-modal-form stock-premium-modal-form-vendor">
              <h3 className="stock-premium-modal-form-title">
                <Send className="stock-premium-modal-form-icon" />
                Send to Vendor
              </h3>
              
              <div className="stock-premium-modal-form-group">
                <label className="stock-premium-modal-form-label">Vendor *</label>
                <select
                  value={vendorData.vendorId}
                  onChange={(e) => setVendorData({ ...vendorData, vendorId: e.target.value })}
                  className="stock-premium-modal-select"
                >
                  <option value="">Select Vendor</option>
                  <option value="vendor1">MedSupply Co. - 9876543210</option>
                  <option value="vendor2">PharmaDirect Ltd. - 9123456789</option>
                  <option value="vendor3">HealthCare Supplies - 9988776655</option>
                </select>
              </div>

              <div className="stock-premium-modal-date-grid">
                <div className="stock-premium-modal-form-group">
                  <label className="stock-premium-modal-form-label">Order Date</label>
                  <input
                    type="date"
                    value={vendorData.orderDate}
                    onChange={(e) => setVendorData({ ...vendorData, orderDate: e.target.value })}
                    className="stock-premium-modal-input"
                  />
                </div>
                <div className="stock-premium-modal-form-group">
                  <label className="stock-premium-modal-form-label">
                    Expected Delivery *
                  </label>
                  <input
                    type="date"
                    value={vendorData.expectedDeliveryDate}
                    onChange={(e) => setVendorData({ ...vendorData, expectedDeliveryDate: e.target.value })}
                    className="stock-premium-modal-input"
                  />
                </div>
              </div>

              <div className="stock-premium-modal-form-group">
                <label className="stock-premium-modal-form-label">
                  Additional Notes
                </label>
                <textarea
                  value={vendorData.notes}
                  onChange={(e) => setVendorData({ ...vendorData, notes: e.target.value })}
                  rows="3"
                  className="stock-premium-modal-textarea"
                  placeholder="Any special instructions for the vendor..."
                />
              </div>
            </div>
          )} */}

          {/* 16-15-2052 */}

          {showVendorForm && (
  <div className="stock-premium-modal-form stock-premium-modal-form-vendor">
    <h3 className="stock-premium-modal-form-title">
      <Send className="stock-premium-modal-form-icon" />
      Send to Vendor
    </h3>
    
    <div className="stock-premium-modal-form-group">
      <label className="stock-premium-modal-form-label">Vendor *</label>
      <select
        value={vendorData.vendorId}
        onChange={(e) => setVendorData({ ...vendorData, vendorId: e.target.value })}
        className="stock-premium-modal-select"
      >
        <option value="">Select Vendor</option>
        {vendors && vendors.map(vendor => (
          <option key={vendor._id} value={vendor._id}>
            {vendor.name} - {vendor.company}
          </option>
        ))}
      </select>
    </div>

    <div className="stock-premium-modal-date-grid">
      <div className="stock-premium-modal-form-group">
        <label className="stock-premium-modal-form-label">Order Date</label>
        <input
          type="date"
          value={vendorData.orderDate}
          onChange={(e) => setVendorData({ ...vendorData, orderDate: e.target.value })}
          className="stock-premium-modal-input"
        />
      </div>
      <div className="stock-premium-modal-form-group">
        <label className="stock-premium-modal-form-label">
          Expected Delivery *
        </label>
        <input
          type="date"
          value={vendorData.expectedDeliveryDate}
          onChange={(e) => setVendorData({ ...vendorData, expectedDeliveryDate: e.target.value })}
          className="stock-premium-modal-input"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>

    <div className="stock-premium-modal-form-group">
      <label className="stock-premium-modal-form-label">
        Additional Notes
      </label>
      <textarea
        value={vendorData.notes}
        onChange={(e) => setVendorData({ ...vendorData, notes: e.target.value })}
        rows="3"
        className="stock-premium-modal-textarea"
        placeholder="Any special instructions for the vendor..."
      />
    </div>
  </div>
)}

          {/* Actions */}
          <div className="stock-premium-modal-actions">
            {request.status === 'Pending' && !showRejectForm && !showVendorForm && (
              <>
                <button
                  onClick={() => onApprove(request._id)}
                  className="stock-premium-modal-btn stock-premium-modal-btn-approve"
                >
                  âœ“ Approve Request
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="stock-premium-modal-btn stock-premium-modal-btn-reject"
                >
                  âœ• Reject Request
                </button>
              </>
            )}

            {showRejectForm && (
              <>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="stock-premium-modal-btn stock-premium-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="stock-premium-modal-btn stock-premium-modal-btn-reject"
                >
                  Confirm Rejection
                </button>
              </>
            )}

            {request.status === 'Approved' && !showVendorForm && (
              <button
                onClick={() => setShowVendorForm(true)}
                className="stock-premium-modal-btn stock-premium-modal-btn-vendor"
              >
                ðŸ“¤ Send to Vendor
              </button>
            )}

            {showVendorForm && (
              <>
                <button
                  onClick={() => setShowVendorForm(false)}
                  className="stock-premium-modal-btn stock-premium-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToVendor}
                  disabled={!vendorData.vendorId || !vendorData.expectedDeliveryDate}
                  className="stock-premium-modal-btn stock-premium-modal-btn-vendor"
                >
                  Confirm & Send
                </button>
              </>
            )}

            {!showRejectForm && !showVendorForm && request.status !== 'Pending' && request.status !== 'Approved' && (
              <button
                onClick={onClose}
                className="stock-premium-modal-btn stock-premium-modal-btn-cancel"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockRequestManagement;