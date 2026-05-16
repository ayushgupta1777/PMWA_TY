import React, { useState, useCallback } from 'react';
import { billService } from '../services/billService';

export const useBilling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate bill
  const generateBill = useCallback(async (billData) => {
    try {
      setLoading(true);
      setError('');
      const blob = await billService.generateBill(billData);
      return blob;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to generate bill';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get bill history
  const getBillHistory = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await billService.getBillHistory(params);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch bill history';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Download bill
  const downloadBill = useCallback(async (billId) => {
    try {
      setLoading(true);
      setError('');
      const blob = await billService.downloadBill(billId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill-${billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to download bill';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get bill analytics
  const getBillAnalytics = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await billService.getBillAnalytics(params);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analytics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateBill,
    getBillHistory,
    downloadBill,
    getBillAnalytics
  };
};