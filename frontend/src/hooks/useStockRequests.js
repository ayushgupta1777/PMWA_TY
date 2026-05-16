// src/hooks/useStockRequests.js
import { useState, useCallback } from 'react';
import workerService from '../services/workerService';

export const useStockRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkDuplicates = useCallback(async (medicineId) => {
    try {
      const response = await workerService.checkDuplicateRequests(medicineId);
      return response.duplicates || [];
    } catch (err) {
      console.error('Error checking duplicates:', err);
      return [];
    }
  }, []);

  const fetchRequests = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await workerService.getMyStockRequests(filters);
      setRequests(response.requests || []);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch requests';
      setError(errorMsg);
      console.error('Fetch requests error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequestStatus = useCallback(async (requestId) => {
    try {
      const response = await workerService.getRequestStatus(requestId);
      return response.request;
    } catch (err) {
      console.error('Error getting request status:', err);
      throw err;
    }
  }, []);

  const createRequest = useCallback(async (requestData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await workerService.createStockRequest(requestData);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create request';
      setError(errorMsg);
      console.error('Create request error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBulkRequests = useCallback(async (requestsData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await workerService.createBulkStockRequests(requestsData);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create requests';
      setError(errorMsg);
      console.error('Create bulk requests error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDuplicateSummary = useCallback(async () => {
    try {
      const response = await workerService.getDuplicateRequestSummary();
      return response;
    } catch (err) {
      console.error('Error getting duplicate summary:', err);
      return { totalDuplicates: 0, duplicateMedicines: [] };
    }
  }, []);

  const getPopularMedicines = useCallback(async (limit = 20) => {
    try {
      const response = await workerService.getPopularMedicines(limit);
      return response.medicines || [];
    } catch (err) {
      console.error('Error getting popular medicines:', err);
      return [];
    }
  }, []);

  const searchMedicines = useCallback(async (query) => {
    try {
      const response = await workerService.searchMedicines(query);
      return response.results || [];
    } catch (err) {
      console.error('Error searching medicines:', err);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    requests,
    loading,
    error,
    checkDuplicates,
    fetchRequests,
    getRequestStatus,
    createRequest,
    createBulkRequests,
    getDuplicateSummary,
    getPopularMedicines,
    searchMedicines,
    clearError
  };
};

export default useStockRequests;

// // src/hooks/useStockRequests.js
// import { useState, useCallback } from 'react';
// import workerService from '../services/workerService';

// export const useStockRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Check for duplicate requests
//   const checkDuplicates = useCallback(async (medicineId) => {
//     try {
//       const response = await workerService.checkDuplicateRequests(medicineId);
//       return response.duplicates || [];
//     } catch (err) {
//       console.error('Error checking duplicates:', err);
//       return [];
//     }
//   }, []);

//   // Get my stock requests
//   const fetchMyRequests = useCallback(async (filters = {}) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await workerService.getMyStockRequests(filters);
//       setRequests(response.requests || []);
//       return response;
//     } catch (err) {
//       setError(err.message || 'Failed to fetch requests');
//       console.error('Fetch requests error:', err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Get request status
//   const getRequestStatus = useCallback(async (requestId) => {
//     try {
//       const response = await workerService.getRequestStatus(requestId);
//       return response.request;
//     } catch (err) {
//       console.error('Error getting request status:', err);
//       throw err;
//     }
//   }, []);

//   // Create single request
//   const createRequest = useCallback(async (requestData) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await workerService.createStockRequest(requestData);
//       return response;
//     } catch (err) {
//       setError(err.message || 'Failed to create request');
//       console.error('Create request error:', err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Create bulk requests
//   const createBulkRequests = useCallback(async (requestsData) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await workerService.createBulkStockRequests(requestsData);
//       return response;
//     } catch (err) {
//       setError(err.message || 'Failed to create requests');
//       console.error('Create bulk requests error:', err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Get duplicate summary
//   const getDuplicateSummary = useCallback(async () => {
//     try {
//       const response = await workerService.getDuplicateRequestSummary();
//       return response;
//     } catch (err) {
//       console.error('Error getting duplicate summary:', err);
//       return { totalDuplicates: 0, duplicateMedicines: [] };
//     }
//   }, []);

//   // Get popular medicines
//   const getPopularMedicines = useCallback(async (limit = 20) => {
//     try {
//       const response = await workerService.getPopularMedicines(limit);
//       return response.medicines || [];
//     } catch (err) {
//       console.error('Error getting popular medicines:', err);
//       return [];
//     }
//   }, []);

//   // Search medicines
//   const searchMedicines = useCallback(async (query) => {
//     try {
//       const response = await workerService.searchMedicines(query);
//       return response.results || [];
//     } catch (err) {
//       console.error('Error searching medicines:', err);
//       return [];
//     }
//   }, []);

//   // Clear error
//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   return {
//     requests,
//     loading,
//     error,
//     checkDuplicates,
//     fetchMyRequests,
//     getRequestStatus,
//     createRequest,
//     createBulkRequests,
//     getDuplicateSummary,
//     getPopularMedicines,
//     searchMedicines,
//     clearError
//   };
// };

// export default useStockRequests;