// ===== WORKER SERVICE FIX (workerService.js) =====

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class WorkerService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/worker`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✓ API Response:', response.config.url, response.status);
        return response.data;
      },
      (error) => {
        console.error('✗ API Error:', error.config?.url, error.response?.status);
        return Promise.reject(error);
      }
    );
  }

  // ===== STOCK REQUEST METHODS =====

  /**
   * Check for duplicate requests in last 2 days
   * @param {string} medicineId - Medicine ID to check
   * @returns {Object} { duplicates: [], duplicateCount: 0 }
   */
  async checkDuplicateRequests(medicineId) {
    try {
      if (!medicineId) {
        throw new Error('Medicine ID is required');
      }

      console.log('🔍 Checking duplicates for medicine:', medicineId);

      const response = await this.api.get('/stock-requests/check-duplicate', {
        params: { medicineId }
      });

      console.log(`Found ${response.duplicateCount} duplicates`);
      return response;
    } catch (error) {
      console.error('Duplicate check error:', error.message);
      return { 
        duplicates: [], 
        duplicateCount: 0,
        hasDuplicates: false,
        error: error.message
      };
    }
  }

  /**
   * Get all my stock requests
   * @returns {Object} { success: boolean, requests: [] }
   */
  async getMyStockRequests(params = {}) {
    try {
      console.log('📋 Fetching my stock requests');

      const response = await this.api.get('/stock-requests', { params });

      console.log(`Retrieved ${response.requests?.length || 0} requests`);
      return response;
    } catch (error) {
      console.error('Get requests error:', error);
      throw error;
    }
  }

  /**
   * Get status of specific request
   * @param {string} requestId - Request ID
   * @returns {Object} Request details
   */
  async getRequestStatus(requestId) {
    try {
      const response = await this.api.get(`/stock-requests/${requestId}`);
      return response;
    } catch (error) {
      console.error('Get status error:', error);
      throw error;
    }
  }

  /**
   * Create single stock request
   * @param {Object} requestData - Request data
   * @returns {Object} Created request
   */
  async createStockRequest(requestData) {
    try {
      console.log('📝 Creating single request:', requestData);

      const response = await this.api.post('/stock-requests', requestData);
      
      console.log('✓ Request created:', response.request?.requestNumber);
      return response;
    } catch (error) {
      console.error('Create request error:', error);
      throw error;
    }
  }

  /**
   * Create multiple stock requests at once
   * @param {Array} requestsData - Array of request data
   * @returns {Object} { created: number, failed: number, requests: [] }
   */
  async createBulkStockRequests(requestsData) {
    try {
      // Validate input
      if (!Array.isArray(requestsData) || requestsData.length === 0) {
        throw new Error('Requests must be a non-empty array');
      }

      console.log(`📦 Creating ${requestsData.length} bulk requests`);

      // Format and validate each request
      const formatted = requestsData.map((req, index) => {
        if (!req.tabletId || !req.quantity || !req.reason) {
          throw new Error(`Request ${index + 1}: Missing required fields`);
        }

        return {
          tabletId: req.tabletId,
          quantity: parseInt(req.quantity),
          urgencyLevel: req.urgencyLevel || 'Medium',
          reason: req.reason.trim(),
          currentStock: req.currentStock || 0,
          estimatedCost: parseFloat(req.estimatedCost) || 0
        };
      });

      console.log('Formatted requests:', formatted);

      const response = await this.api.post('/stock-requests/bulk-create', formatted);

      console.log(`✓ Created ${response.created} requests, ${response.failed} failed`);
      return response;
    } catch (error) {
      console.error('Bulk create error:', error);
      throw error;
    }
  }

  /**
   * Get duplicate request summary for dashboard
   * @returns {Object} { totalDuplicates: 0, duplicateMedicines: [] }
   */
  async getDuplicateRequestSummary() {
    try {
      const response = await this.api.get('/stock-requests/summary/duplicates');
      return response;
    } catch (error) {
      console.error('Get duplicate summary error:', error);
      return { totalDuplicates: 0, duplicateMedicines: [] };
    }
  }

  // ===== MEDICINE METHODS =====

  /**
   * Search medicines by query
   * @param {string} query - Search query
   * @returns {Object} { results: [] }
   */
  async searchMedicines(query) {
    try {
      if (!query || query.trim().length < 2) {
        return { results: [] };
      }

      console.log('🔎 Searching medicines:', query);

      const response = await this.api.get('/medicines/search', {
        params: { q: query }
      });

      console.log(`Found ${response.results?.length || 0} medicines`);
      return response;
    } catch (error) {
      console.error('Search error:', error);
      return { results: [] };
    }
  }

  /**
   * Get popular medicines with low stock
   * @param {number} limit - Number of results
   * @returns {Object} { medicines: [] }
   */
  async getPopularMedicines(limit = 20) {
    try {
      const response = await this.api.get('/medicines/popular', {
        params: { limit }
      });
      return response;
    } catch (error) {
      console.error('Get popular medicines error:', error);
      return { medicines: [] };
    }
  }
}

export default new WorkerService();