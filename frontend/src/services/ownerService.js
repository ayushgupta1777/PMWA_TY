// src/services/ownerService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class OwnerService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/owner`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle responses and errors
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('Owner API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // Dashboard Stats
  async getDashboardStats(period = 'today') {
    return await this.api.get(`/dashboard/stats?period=${period}`);
  }

  // Worker Performance
  async getWorkerPerformance(period = 'today', limit = 10) {
    return await this.api.get(`/workers/performance?period=${period}&limit=${limit}`);
  }

  // Individual Worker Details
  async getWorkerDetails(workerId, period = 'month') {
    return await this.api.get(`/workers/${workerId}/details?period=${period}`);
  }

  // Worker Sales History
  async getWorkerSalesHistory(workerId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.api.get(`/workers/${workerId}/sales?${query}`);
  }

  // Stock Alerts
  async getStockAlerts() {
    return await this.api.get('/inventory/alerts');
  }

  // Critical Alerts
  async getCriticalAlerts() {
    return await this.api.get('/alerts/critical');
  }

  // Sales Trends
  async getSalesTrends(period = 'today') {
    return await this.api.get(`/sales/trends?period=${period}`);
  }

  // Revenue Analytics
  async getRevenueAnalytics(startDate, endDate) {
    return await this.api.get(`/analytics/revenue?start=${startDate}&end=${endDate}`);
  }

  // Top Selling Medicines
  async getTopSellingMedicines(period = 'month', limit = 10) {
    return await this.api.get(`/analytics/top-medicines?period=${period}&limit=${limit}`);
  }

  // Inventory Overview
  async getInventoryOverview() {
    return await this.api.get('/inventory/overview');
  }

  // Demand Pattern Analysis
  async getDemandPatterns(medicineId) {
    return await this.api.get(`/analytics/demand/${medicineId}`);
  }

  // Worker Management
  async getAllWorkers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.api.get(`/workers?${query}`);
  }

  async createWorker(workerData) {
    return await this.api.post('/workers', workerData);
  }

  async updateWorker(workerId, workerData) {
    return await this.api.put(`/workers/${workerId}`, workerData);
  }

  async deleteWorker(workerId) {
    return await this.api.delete(`/workers/${workerId}`);
  }

  async toggleWorkerStatus(workerId) {
    return await this.api.patch(`/workers/${workerId}/toggle-status`);
  }

  // Medicine Management
  async getAllMedicines(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.api.get(`/medicines?${query}`);
  }

  async createMedicine(medicineData) {
    return await this.api.post('/medicines', medicineData);
  }

  async updateMedicine(medicineId, medicineData) {
    return await this.api.put(`/medicines/${medicineId}`, medicineData);
  }

  async deleteMedicine(medicineId) {
    return await this.api.delete(`/medicines/${medicineId}`);
  }

  async updateStock(medicineId, quantity, type = 'add') {
    return await this.api.patch(`/medicines/${medicineId}/stock`, { quantity, type });
  }

  async bulkUpdateStock(updates) {
    return await this.api.post('/medicines/bulk-stock-update', { updates });
  }

  // Reports
  async generateSalesReport(startDate, endDate, format = 'pdf') {
    const response = await axios.get(
      `${API_BASE_URL}/api/owner/reports/sales`,
      {
        params: { startDate, endDate, format },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: format === 'pdf' ? 'blob' : 'json'
      }
    );
    return response.data;
  }

  async generateInventoryReport(format = 'pdf') {
    const response = await axios.get(
      `${API_BASE_URL}/api/owner/reports/inventory`,
      {
        params: { format },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: format === 'pdf' ? 'blob' : 'json'
      }
    );
    return response.data;
  }

  async generateWorkerReport(workerId, startDate, endDate, format = 'pdf') {
    const response = await axios.get(
      `${API_BASE_URL}/api/owner/reports/worker/${workerId}`,
      {
        params: { startDate, endDate, format },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: format === 'pdf' ? 'blob' : 'json'
      }
    );
    return response.data;
  }

  // Notifications
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.api.get(`/notifications?${query}`);
  }

  async markNotificationRead(notificationId) {
    return await this.api.patch(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead() {
    return await this.api.patch('/notifications/read-all');
  }

  // Settings
  async getSettings() {
    return await this.api.get('/settings');
  }

  async updateSettings(settings) {
    return await this.api.put('/settings', settings);
  }

  // Dashboard Configuration
  async getDashboardConfig() {
    return await this.api.get('/dashboard/config');
  }

  async updateDashboardConfig(config) {
    return await this.api.put('/dashboard/config', config);
  }
  // Add these methods to the OwnerService class in ownerService.js





// Get Stock Requests (now supports vendor filter)
// async getStockRequests(params = {}) {
//   const query = new URLSearchParams(params).toString();
//   return await this.api.get(`/stock-requests?${query}`);
// }

// // Get Stock Request Statistics (now includes uniqueVendors)
// async getStockRequestStats() {
//   return await this.api.get('/stock-requests/stats');
// }

// // Get Vendors with Request Counts (NEW)
// async getVendorsWithRequestCounts() {
//   return await this.api.get('/stock-requests/vendors-with-counts');
// }

// // Get Stock Request by ID
// async getStockRequestById(requestId) {
//   return await this.api.get(`/stock-requests/${requestId}`);
// }

// // Approve Stock Request
// async approveStockRequest(requestId) {
//   return await this.api.patch(`/stock-requests/${requestId}/approve`);
// }

// // Reject Stock Request
// async rejectStockRequest(requestId, reason) {
//   return await this.api.patch(`/stock-requests/${requestId}/reject`, { reason });
// }

// // Send Single Request to Vendor
// async sendToVendor(requestId, vendorData) {
//   return await this.api.post(`/stock-requests/${requestId}/send-to-vendor`, vendorData);
// }

// Add to your existing ownerService.js

// Get Stock Requests
async getStockRequests(params = {}) {
  try {
    const response = await this.api.get('/stock-requests', { params });
    return response.data;
  } catch (error) {
    console.error('Get stock requests error:', error);
    throw error;
  }
}

// Get Stock Request Stats
  /**
   * Get all stock requests with filters and pagination
   * @param {Object} params - { page, limit, status, urgency, search, vendor }
   * @returns {Object} { requests: [], pagination: {} }
   */
  async getStockRequests(params = {}) {
    try {
      console.log('📊 Fetching stock requests with filters:', params);

      // Build query parameters
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      if (params.status) query.append('status', params.status);
      if (params.urgency) query.append('urgency', params.urgency);
      if (params.search) query.append('search', params.search);
      if (params.vendor) query.append('vendor', params.vendor);

      const response = await this.api.get(`/stock-requests?${query.toString()}`);

      console.log(`Retrieved ${response.requests?.length || 0} requests`);
      return response;
    } catch (error) {
      console.error('Get stock requests error:', error);
      throw error;
    }
  }

  /**
   * Get stock request statistics
   * @returns {Object} { pending, approved, rejected, critical, uniqueVendors }
   */
  async getStockRequestStats() {
    try {
      console.log('📈 Fetching stock request stats');

      const response = await this.api.get('/stock-requests/stats');

      console.log('Stats:', response);
      return response;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }

  /**
   * Get vendors with their pending request counts
   * @returns {Object} { vendors: [] }
   */
  async getVendorsWithRequestCounts() {
    try {
      console.log('🏢 Fetching vendors with counts');

      const response = await this.api.get('/stock-requests/vendors-with-counts');

      console.log(`Retrieved ${response.vendors?.length || 0} vendors`);
      return response;
    } catch (error) {
      console.error('Get vendors error:', error);
      return { vendors: [] };
    }
  }

  /**
   * Approve a single stock request
   * @param {string} requestId - Request ID
   * @returns {Object} Updated request
   */
  async approveStockRequest(requestId) {
    try {
      console.log('✅ Approving request:', requestId);

      const response = await this.api.patch(`/stock-requests/${requestId}/approve`);

      console.log('✓ Request approved');
      return response;
    } catch (error) {
      console.error('Approve error:', error);
      throw error;
    }
  }

  /**
   * Reject a single stock request
   * @param {string} requestId - Request ID
   * @param {string} reason - Rejection reason
   * @returns {Object} Updated request
   */
  async rejectStockRequest(requestId, reason) {
    try {
      console.log('❌ Rejecting request:', requestId, 'Reason:', reason);

      const response = await this.api.patch(`/stock-requests/${requestId}/reject`, { reason });

      console.log('✓ Request rejected');
      return response;
    } catch (error) {
      console.error('Reject error:', error);
      throw error;
    }
  }

  /**
   * Send multiple approved requests to vendor at once
   * @param {Array} requestIds - Array of request IDs
   * @param {Object} vendorData - { vendorId, orderDate, expectedDeliveryDate, notes }
   * @returns {Object} { success, updatedCount, totalCost }
   */
  async bulkSendToVendor(requestIds, vendorData) {
    try {
      // Validate input
      if (!Array.isArray(requestIds) || requestIds.length === 0) {
        throw new Error('At least one request must be selected');
      }

      if (!vendorData.vendorId) {
        throw new Error('Vendor is required');
      }

      if (!vendorData.expectedDeliveryDate) {
        throw new Error('Expected delivery date is required');
      }

      console.log('📮 Sending to vendor:');
      console.log('  Requests:', requestIds.length);
      console.log('  Vendor:', vendorData.vendorId);
      console.log('  Delivery:', vendorData.expectedDeliveryDate);

      const payload = {
        requestIds: requestIds,
        vendorId: vendorData.vendorId,
        orderDate: vendorData.orderDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate: vendorData.expectedDeliveryDate,
        notes: vendorData.notes || ''
      };

      const response = await this.api.post('/stock-requests/bulk-send-to-vendor', payload);

      console.log(`✓ Sent ${response.updatedCount} requests to vendor`);
      console.log(`Total cost: ₹${response.totalCost}`);

      return response;
    } catch (error) {
      console.error('Bulk send error:', error);
      throw error;
    }
  }

  /**
   * Send single request to vendor
   * @param {string} requestId - Request ID
   * @param {Object} vendorData - Vendor data
   * @returns {Object} Updated request
   */
  async sendToVendor(requestId, vendorData) {
    try {
      console.log('📮 Sending request to vendor:', requestId);

      const response = await this.api.post(
        `/stock-requests/${requestId}/send-to-vendor`,
        vendorData
      );

      console.log('✓ Request sent to vendor');
      return response;
    } catch (error) {
      console.error('Send to vendor error:', error);
      throw error;
    }
  }

  /**
   * Mark stock as received
   * @param {string} requestId - Request ID
   * @param {Object} data - Received data
   * @returns {Object} Updated request
   */
  async markStockReceived(requestId, data) {
    try {
      console.log('📦 Marking stock as received:', requestId);

      const response = await this.api.patch(
        `/stock-requests/${requestId}/received`,
        data
      );

      console.log('✓ Stock marked as received');
      return response;
    } catch (error) {
      console.error('Mark received error:', error);
      throw error;
    }
  }

// Mark Stock as Received
// async markStockReceived(requestId, data) {
//   return await this.api.patch(`/stock-requests/${requestId}/received`, data);
// }



// // Vendor Management
// async getVendors(params = {}) {
//   const query = new URLSearchParams(params).toString();
//   return await this.api.get(`/vendors?${query}`);
// }

// async getVendorById(vendorId) {
//   return await this.api.get(`/vendors/${vendorId}`);
// }

// async createVendor(vendorData) {
//   return await this.api.post('/vendors', vendorData);
// }

// async updateVendor(vendorId, vendorData) {
//   return await this.api.put(`/vendors/${vendorId}`, vendorData);
// }

// async deleteVendor(vendorId) {
//   return await this.api.delete(`/vendors/${vendorId}`);
// }

// async toggleVendorStatus(vendorId) {
//   return await this.api.patch(`/vendors/${vendorId}/toggle-status`);
// }

// async getVendorStats() {
//   return await this.api.get('/vendors/stats');
// }

// async updateVendorRating(vendorId, rating) {
//   return await this.api.patch(`/vendors/${vendorId}/rating`, { rating });
// }


// async getVendorsWithRequestCounts() {
//   return await this.api.get('/stock-requests/vendors-with-counts');
// }

// Bulk Send to Vendor
// async bulkSendToVendor(requestIds, vendorData) {
//   return await this.api.post('/stock-requests/bulk-send-to-vendor', {
//     requestIds,
//     ...vendorData
//   });

// }



async getStockRequests(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.urgency) query.append('urgency', params.urgency);
    if (params.search) query.append('search', params.search);
    if (params.vendor) query.append('vendor', params.vendor);

    const response = await this.api.get(`/stock-requests?${query.toString()}`);
    console.log('Stock requests response:', response);
    return response;
  } catch (error) {
    console.error('Get stock requests error:', error);
    throw error;
  }
}

// Get Stock Request Statistics
async getStockRequestStats() {
  try {
    const response = await this.api.get('/stock-requests/stats');
    console.log('Stats response:', response);
    return response;
  } catch (error) {
    console.error('Get stats error:', error);
    throw error;
  }
}

// Get Vendors with Request Counts (MOST IMPORTANT FIX)
async getVendorsWithRequestCounts() {
  try {
    const response = await this.api.get('/stock-requests/vendors-with-counts');
    console.log('Vendors with counts response:', response);
    
    // Ensure we return the vendors array
    if (response.vendors) {
      return { vendors: response.vendors };
    }
    return { vendors: [] };
  } catch (error) {
    console.error('Get vendors with counts error:', error);
    console.log('Error details:', error.response?.data);
    return { vendors: [] };
  }
}

// Bulk Send to Vendor
async bulkSendToVendor(requestIds, vendorData) {
  try {
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new Error('Request IDs must be a non-empty array');
    }

    const payload = {
      requestIds,
      vendorId: vendorData.vendorId,
      orderDate: vendorData.orderDate,
      expectedDeliveryDate: vendorData.expectedDeliveryDate,
      notes: vendorData.notes || ''
    };

    console.log('Bulk send payload:', payload);

    const response = await this.api.post('/stock-requests/bulk-send-to-vendor', payload);
    console.log('Bulk send response:', response);
    return response;
  } catch (error) {
    console.error('Bulk send error:', error);
    console.log('Error response:', error.response?.data);
    throw error;
  }
}

// Approve Single Request
async approveStockRequest(requestId) {
  try {
    const response = await this.api.patch(`/stock-requests/${requestId}/approve`);
    return response;
  } catch (error) {
    console.error('Approve request error:', error);
    throw error;
  }
}

// Reject Single Request
async rejectStockRequest(requestId, reason) {
  try {
    const response = await this.api.patch(`/stock-requests/${requestId}/reject`, { reason });
    return response;
  } catch (error) {
    console.error('Reject request error:', error);
    throw error;
  }
}

// Send Single Request to Vendor
// async sendToVendor(requestId, vendorData) {
//   try {
//     const response = await this.api.post(`/stock-requests/${requestId}/send-to-vendor`, vendorData);
//     return response;
//   } catch (error) {
//     console.error('Send to vendor error:', error);
//     throw error;
//   }
// }

// Mark as Received
async markStockReceived(requestId, data) {
  try {
    const response = await this.api.patch(`/stock-requests/${requestId}/received`, data);
    return response;
  } catch (error) {
    console.error('Mark as received error:', error);
    throw error;
  }
}


}

export const ownerService = new OwnerService();