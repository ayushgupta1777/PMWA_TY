// src/services/stockRequestService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const getAuthHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

class StockRequestService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // ===== STOCK REQUEST METHODS =====

  // Check for duplicate requests of a medicine

  
  async checkDuplicateRequests(medicineId) {
    return (await this.api.get(`/stock-requests/check-duplicate?medicineId=${medicineId}`)).data;
  }

  // Get my stock requests
  async getMyStockRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return (await this.api.get(`/stock-requests?${query}`)).data;
  }

  // Alias for backward compatibility
  async getMyRequests(params = {}) {
    return await this.getMyStockRequests(params);
  }

  // Get status of a specific request
  async getRequestStatus(requestId) {
    return (await this.api.get(`/stock-requests/${requestId}`)).data;
  }

  // Create a single stock request
  async createStockRequest(requestData) {
    return (await this.api.post('/stock-requests', requestData)).data;
  }

  // Backward compatible alias
  async createRequest(requestData) {
    return await this.createStockRequest(requestData);
  }

  // Create bulk stock requests
  async createBulkStockRequests(requestsData) {
    return (await this.api.post('/stock-requests/bulk-create', requestsData)).data;
  }

  // Backward compatible alias
  async createBulkRequests(requestsData) {
    return await this.createBulkStockRequests(requestsData);
  }

  // Get duplicate request summary (for dashboard)
  async getDuplicateRequestSummary() {
    return (await this.api.get('/stock-requests/summary/duplicates')).data;
  }

  // ===== MEDICINE METHODS =====

  // Get popular medicines with low stock
  async getPopularMedicines(params = {}) {
    const query = new URLSearchParams(params).toString();
    return (await this.api.get(`/medicines/popular?${query}`)).data;
  }

  // Temporary vendor endpoint placeholder (no backend yet)
  async getVendors(params = {}) {
    console.warn('⚠️ getVendors() is not implemented on backend yet — returning empty array.');
    return { vendors: [] };
  }

  // Search medicines
  async searchMedicines(query) {
    return (await this.api.get(`/medicines/search?q=${encodeURIComponent(query)}`)).data;
  }

  // ===== ADMIN PLACEHOLDERS =====
  async approveRequest() {
    console.warn('approveRequest() not implemented yet');
    return { success: false, message: 'Not implemented' };
  }

  async rejectRequest() {
    console.warn('rejectRequest() not implemented yet');
    return { success: false, message: 'Not implemented' };
  }

  async markAsOrdered() {
    console.warn('markAsOrdered() not implemented yet');
    return { success: false, message: 'Not implemented' };
  }

  async markAsReceived() {
    console.warn('markAsReceived() not implemented yet');
    return { success: false, message: 'Not implemented' };
  }

  async getStats() {
    console.warn('getStats() not implemented yet');
    return { stats: {} };
  }











   async getMyRequests() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stock-requests/my-requests`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Worker: Create single stock request
  async createRequest(requestData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/stock-requests/create`,
        requestData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Worker: Create bulk stock requests
  async createBulkRequests(requests) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/stock-requests/create-bulk`,
        { requests },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Get all requests (with filters)
  async getAllRequests(filters = {}) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stock-requests/all`,
        {
          ...getAuthHeaders(),
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Approve request
  async approveRequest(requestId, data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/stock-requests/${requestId}/approve`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Reject request
  async rejectRequest(requestId, adminNotes) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/stock-requests/${requestId}/reject`,
        { adminNotes },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Mark as ordered
  async markAsOrdered(requestId, data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/stock-requests/${requestId}/mark-ordered`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Admin: Mark as received
  async markAsReceived(requestId, data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/stock-requests/${requestId}/mark-received`,
        data,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get dashboard stats
  async getStats() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stock-requests/stats`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get vendors
  async getVendors(filters = {}) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/vendors`,
        {
          ...getAuthHeaders(),
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create vendor
  async createVendor(vendorData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/vendors/create`,
        vendorData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      return new Error('No response from server');
    } else {
      return new Error(error.message || 'An error occurred');
    }
  }
}

export default new StockRequestService();
