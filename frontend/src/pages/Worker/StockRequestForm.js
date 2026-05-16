// src/components/Worker/StockRequestForm.js - WITH DUPLICATE DETECTION
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, Send, X } from 'lucide-react';
import { workerService } from '../../services/workerService';

const StockRequestForm = ({ medicine, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    urgency: 'Medium',
    reason: '',
    preferredVendor: ''
  });
  const [vendors, setVendors] = useState([]);
  const [duplicateAlert, setDuplicateAlert] = useState(null); // ✅ NEW
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendors();
    checkDuplicateRequests(); // ✅ NEW: Check for duplicates
  }, [medicine._id]);

  const fetchVendors = async () => {
    try {
      const response = await workerService.getVendorsForMedicine(medicine._id);
      setVendors(response.vendors || []);
      
      // Auto-select preferred vendor if available
      const preferred = response.vendors?.find(v => v.isPreferred);
      if (preferred) {
        setFormData(prev => ({ ...prev, preferredVendor: preferred._id }));
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  // ✅ NEW: Check for duplicate requests in last 2 days
  const checkDuplicateRequests = async () => {
    try {
      const response = await workerService.checkDuplicateRequest(medicine._id);
      
      if (response.hasDuplicate) {
        setDuplicateAlert(response.existingRequest);
        setShowDuplicateWarning(true);
      }
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Show warning if duplicate exists
    if (duplicateAlert && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the stock request');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await workerService.createStockRequest({
        tabletId: medicine._id,
        requestedQuantity: formData.quantity,
        urgencyLevel: formData.urgency,
        reason: formData.reason,
        preferredVendor: formData.preferredVendor || undefined,
        currentStock: medicine.stock
      });

      alert('Stock request submitted successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to submit request:', error);
      setError(error.message || 'Failed to submit stock request');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle proceeding despite duplicate
  const handleProceedAnyway = () => {
    setShowDuplicateWarning(false);
    // Form will submit on next attempt
  };

  return (
    <div className="stock-request-modal-overlay">
      <div className="stock-request-modal">
        <div className="stock-request-modal-header">
          <h2>Request Stock for {medicine.name}</h2>
          <button onClick={onClose} className="stock-request-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ✅ NEW: Duplicate Warning */}
        {showDuplicateWarning && duplicateAlert && (
          <div className="stock-request-duplicate-alert">
            <div className="stock-request-alert-icon-wrapper">
              <AlertTriangle className="stock-request-alert-icon" />
            </div>
            <div className="stock-request-alert-content">
              <h3 className="stock-request-alert-title">Duplicate Request Detected!</h3>
              <p className="stock-request-alert-text">
                A similar request for <strong>{medicine.name}</strong> was already made 
                on <strong>{new Date(duplicateAlert.createdAt).toLocaleDateString()}</strong>
              </p>
              <div className="stock-request-alert-details">
                <div className="stock-request-alert-item">
                  <span className="stock-request-alert-label">Request Number:</span>
                  <span className="stock-request-alert-value">{duplicateAlert.requestNumber}</span>
                </div>
                <div className="stock-request-alert-item">
                  <span className="stock-request-alert-label">Status:</span>
                  <span className={`stock-request-status-badge stock-request-status-${duplicateAlert.status.toLowerCase()}`}>
                    {duplicateAlert.status}
                  </span>
                </div>
                <div className="stock-request-alert-item">
                  <span className="stock-request-alert-label">Requested Quantity:</span>
                  <span className="stock-request-alert-value">{duplicateAlert.requestedQuantity}</span>
                </div>
                <div className="stock-request-alert-item">
                  <span className="stock-request-alert-label">Requested By:</span>
                  <span className="stock-request-alert-value">{duplicateAlert.requestedBy?.name}</span>
                </div>
              </div>
              
              <div className="stock-request-alert-actions">
                <button
                  onClick={onClose}
                  className="stock-request-alert-btn stock-request-alert-btn-cancel"
                >
                  Cancel Request
                </button>
                <button
                  onClick={handleProceedAnyway}
                  className="stock-request-alert-btn stock-request-alert-btn-proceed"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stock-request-form">
          {error && (
            <div className="stock-request-error">
              {error}
            </div>
          )}

          {/* Medicine Info */}
          <div className="stock-request-medicine-info">
            <Package className="stock-request-medicine-icon" />
            <div>
              <p className="stock-request-medicine-name">{medicine.name}</p>
              <p className="stock-request-medicine-meta">
                {medicine.brand} • {medicine.company}
              </p>
              <p className="stock-request-medicine-stock">
                Current Stock: <strong>{medicine.stock} units</strong>
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="stock-request-form-group">
            <label className="stock-request-label">
              Requested Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="stock-request-input"
              required
            />
          </div>

          {/* Urgency */}
          <div className="stock-request-form-group">
            <label className="stock-request-label">
              Urgency Level *
            </label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="stock-request-select"
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Preferred Vendor */}
          <div className="stock-request-form-group">
            <label className="stock-request-label">
              Preferred Vendor
            </label>
            <select
              value={formData.preferredVendor}
              onChange={(e) => setFormData({ ...formData, preferredVendor: e.target.value })}
              className="stock-request-select"
            >
              <option value="">Select vendor (optional)</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name} - {vendor.company}
                  {vendor.isPreferred && ' (Preferred)'}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="stock-request-form-group">
            <label className="stock-request-label">
              Reason for Request *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows="4"
              className="stock-request-textarea"
              placeholder="Explain why you need this stock..."
              required
            />
            <p className="stock-request-hint">
              {formData.reason.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="stock-request-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="stock-request-btn stock-request-btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="stock-request-btn stock-request-btn-submit"
              disabled={loading || (showDuplicateWarning && duplicateAlert)}
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .stock-request-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .stock-request-modal {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .stock-request-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E5E7EB;
        }

        .stock-request-modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .stock-request-close-btn {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #6B7280;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .stock-request-close-btn:hover {
          background: #F3F4F6;
        }

        .stock-request-duplicate-alert {
          margin: 20px 24px;
          padding: 16px;
          background: #FEF3C7;
          border: 2px solid #F59E0B;
          border-radius: 8px;
        }

        .stock-request-alert-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: #FCD34D;
          border-radius: 50%;
          margin: 0 auto 12px;
        }

        .stock-request-alert-icon {
          width: 24px;
          height: 24px;
          color: #92400E;
        }

        .stock-request-alert-title {
          font-size: 18px;
          font-weight: 600;
          color: #92400E;
          text-align: center;
          margin-bottom: 8px;
        }

        .stock-request-alert-text {
          font-size: 14px;
          color: #78350F;
          text-align: center;
          margin-bottom: 16px;
        }

        .stock-request-alert-details {
          background: white;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .stock-request-alert-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #F3F4F6;
          font-size: 13px;
        }

        .stock-request-alert-item:last-child {
          border-bottom: none;
        }

        .stock-request-alert-label {
          color: #6B7280;
          font-weight: 500;
        }

        .stock-request-alert-value {
          color: #111827;
          font-weight: 600;
        }

        .stock-request-status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .stock-request-status-pending {
          background: #FEF3C7;
          color: #92400E;
        }

        .stock-request-status-approved {
          background: #D1FAE5;
          color: #065F46;
        }

        .stock-request-status-rejected {
          background: #FEE2E2;
          color: #991B1B;
        }

        .stock-request-alert-actions {
          display: flex;
          gap: 12px;
        }

        .stock-request-alert-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .stock-request-alert-btn-cancel {
          background: white;
          color: #374151;
          border: 1px solid #D1D5DB;
        }

        .stock-request-alert-btn-cancel:hover {
          background: #F9FAFB;
        }

        .stock-request-alert-btn-proceed {
          background: #F59E0B;
          color: white;
        }

        .stock-request-alert-btn-proceed:hover {
          background: #D97706;
        }

        .stock-request-form {
          padding: 24px;
        }

        .stock-request-error {
          background: #FEE2E2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .stock-request-medicine-info {
          display: flex;
          align-items: start;
          gap: 12px;
          padding: 16px;
          background: #F9FAFB;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .stock-request-medicine-icon {
          width: 40px;
          height: 40px;
          color: #3B82F6;
        }

        .stock-request-medicine-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .stock-request-medicine-meta {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 4px;
        }

        .stock-request-medicine-stock {
          font-size: 13px;
          color: #374151;
        }

        .stock-request-form-group {
          margin-bottom: 20px;
        }

        .stock-request-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .stock-request-input,
        .stock-request-select,
        .stock-request-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .stock-request-input:focus,
        .stock-request-select:focus,
        .stock-request-textarea:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .stock-request-hint {
          font-size: 12px;
          color: #6B7280;
          margin-top: 4px;
        }

        .stock-request-form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .stock-request-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .stock-request-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stock-request-btn-cancel {
          background: white;
          color: #374151;
          border: 1px solid #D1D5DB;
        }

        .stock-request-btn-cancel:hover:not(:disabled) {
          background: #F9FAFB;
        }

        .stock-request-btn-submit {
          background: #3B82F6;
          color: white;
        }

        .stock-request-btn-submit:hover:not(:disabled) {
          background: #2563EB;
        }
      `}</style>
    </div>
  );
};

export default StockRequestForm;