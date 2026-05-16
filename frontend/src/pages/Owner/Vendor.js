import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Star, TrendingUp, Package, X, Save, Building, User, CreditCard, FileText } from 'lucide-react';
import '../../Styling/pages/Owner/VendorPremium.css';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);

  const categories = [
    'General', 'Cardio', 'Diabetes', 'Antibiotic', 'Analgesic',
    'Antiseptic', 'Vaccine', 'Anti-inflammatory', 'Antihistamine',
    'Vitamins', 'Ayurvedic'
  ];

  const initialFormData = {
    name: '',
    company: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstNumber: '',
    panNumber: '',
    licenseNumber: '',
    categories: [],
    paymentTerms: {
      creditDays: 30,
      minimumOrderValue: 1000,
      discountPercentage: 0
    },
    contactPerson: {
      name: '',
      designation: '',
      phone: '',
      email: ''
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Vendor name is required';
    if (!formData.company) errors.company = 'Company name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.phone) errors.phone = 'Phone number is required';
    if (formData.categories.length === 0) errors.categories = 'Select at least one category';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `http://localhost:5000/api/vendors/${currentVendor._id}`
        : 'http://localhost:5000/api/vendors/create';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(editMode ? 'Vendor updated successfully!' : 'Vendor created successfully!');
        setShowModal(false);
        resetForm();
        fetchVendors();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentVendor(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditMode(true);
    setCurrentVendor(vendor);
    setFormData({
      name: vendor.name,
      company: vendor.company,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address || initialFormData.address,
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      licenseNumber: vendor.licenseNumber || '',
      categories: vendor.categories || [],
      paymentTerms: vendor.paymentTerms || initialFormData.paymentTerms,
      contactPerson: vendor.contactPerson || initialFormData.contactPerson
    });
    setFormErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setEditMode(false);
    setCurrentVendor(null);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to deactivate this vendor?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Vendor deactivated successfully');
        fetchVendors();
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || vendor.categories.includes(filterCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="vendor-premium-container">
      {/* Header */}
      <div className="vendor-premium-header">
        <div className="vendor-premium-header-content">
          <div className="vendor-premium-header-icon-wrapper">
            <Building className="vendor-premium-header-icon" />
          </div>
          <div className="vendor-premium-header-text">
            <h1 className="vendor-premium-title">Vendor Management</h1>
            <p className="vendor-premium-subtitle">Manage your medical suppliers and vendors</p>
          </div>
        </div>
        <div className="vendor-premium-header-stats">
          <div className="vendor-premium-stat-pill">
            <span className="vendor-premium-stat-pill-label">Total Vendors</span>
            <span className="vendor-premium-stat-pill-value">{vendors.length}</span>
          </div>
          <div className="vendor-premium-stat-pill">
            <span className="vendor-premium-stat-pill-label">Active</span>
            <span className="vendor-premium-stat-pill-value vendor-premium-stat-success">
              {vendors.filter(v => v.isActive !== false).length}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="vendor-premium-actions-bar">
        <div className="vendor-premium-search-wrapper">
          <Search className="vendor-premium-search-icon" />
          <input
            type="text"
            placeholder="Search vendors by name, company or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="vendor-premium-search-input"
          />
          {searchTerm && (
            <button 
              className="vendor-premium-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="vendor-premium-filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={openAddModal}
          className="vendor-premium-add-btn"
        >
          <Plus className="vendor-premium-btn-icon" />
          Add Vendor
        </button>
      </div>

      {/* Vendors Grid */}
      {loading && vendors.length === 0 ? (
        <div className="vendor-premium-loading">
          <div className="vendor-premium-spinner"></div>
          <p className="vendor-premium-loading-text">Loading vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="vendor-premium-empty-state">
          <div className="vendor-premium-empty-icon-wrapper">
            <Building className="vendor-premium-empty-icon" />
          </div>
          <p className="vendor-premium-empty-text">No vendors found</p>
          <p className="vendor-premium-empty-subtext">
            {searchTerm || filterCategory 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first vendor'}
          </p>
          {!searchTerm && !filterCategory && (
            <button onClick={openAddModal} className="vendor-premium-empty-btn">
              <Plus size={18} />
              Add Your First Vendor
            </button>
          )}
        </div>
      ) : (
        <div className="vendor-premium-grid">
          {filteredVendors.map(vendor => (
            <div key={vendor._id} className="vendor-premium-card">
              {/* Vendor Header */}
              <div className="vendor-premium-card-header">
                <div className="vendor-premium-card-avatar">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <div className="vendor-premium-card-info">
                  <h3 className="vendor-premium-card-name">{vendor.name}</h3>
                  <p className="vendor-premium-card-company">{vendor.company}</p>
                </div>
                <div className="vendor-premium-rating-badge">
                  <Star className="vendor-premium-star-icon" />
                  <span className="vendor-premium-rating-value">
                    {vendor.performance?.qualityRating || 5.0}
                  </span>
                </div>
              </div>

              {/* Categories */}
              <div className="vendor-premium-categories">
                {vendor.categories?.slice(0, 3).map(cat => (
                  <span key={cat} className="vendor-premium-category-tag">
                    {cat}
                  </span>
                ))}
                {vendor.categories?.length > 3 && (
                  <span className="vendor-premium-category-more">
                    +{vendor.categories.length - 3} more
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="vendor-premium-contact-section">
                <div className="vendor-premium-contact-item">
                  <Mail className="vendor-premium-contact-icon" />
                  <span className="vendor-premium-contact-text">{vendor.email}</span>
                </div>
                <div className="vendor-premium-contact-item">
                  <Phone className="vendor-premium-contact-icon" />
                  <span className="vendor-premium-contact-text">{vendor.phone}</span>
                </div>
                {vendor.address?.city && (
                  <div className="vendor-premium-contact-item">
                    <MapPin className="vendor-premium-contact-icon" />
                    <span className="vendor-premium-contact-text">
                      {vendor.address.city}, {vendor.address.state}
                    </span>
                  </div>
                )}
              </div>

              {/* Performance Stats */}
              <div className="vendor-premium-stats">
                <div className="vendor-premium-stat-card vendor-premium-stat-delivery">
                  <div className="vendor-premium-stat-header">
                    <TrendingUp className="vendor-premium-stat-icon" />
                    <span className="vendor-premium-stat-label">Delivery</span>
                  </div>
                  <p className="vendor-premium-stat-value">
                    {vendor.performance?.onTimeDeliveryRate || 100}%
                  </p>
                </div>
                <div className="vendor-premium-stat-card vendor-premium-stat-orders">
                  <div className="vendor-premium-stat-header">
                    <Package className="vendor-premium-stat-icon" />
                    <span className="vendor-premium-stat-label">Orders</span>
                  </div>
                  <p className="vendor-premium-stat-value">
                    {vendor.performance?.totalOrders || 0}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="vendor-premium-card-actions">
                <button
                  onClick={() => openEditModal(vendor)}
                  className="vendor-premium-edit-btn"
                >
                  <Edit2 className="vendor-premium-action-icon" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vendor._id)}
                  className="vendor-premium-delete-btn"
                >
                  <Trash2 className="vendor-premium-action-icon" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="vendor-premium-modal-overlay" onClick={(e) => {
          if (e.target.classList.contains('vendor-premium-modal-overlay')) {
            setShowModal(false);
          }
        }}>
          <div className="vendor-premium-modal">
            {/* Modal Header */}
            <div className="vendor-premium-modal-header">
              <div className="vendor-premium-modal-header-content">
                <div className="vendor-premium-modal-icon-wrapper">
                  {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="vendor-premium-modal-title">
                    {editMode ? 'Edit Vendor' : 'Add New Vendor'}
                  </h2>
                  <p className="vendor-premium-modal-subtitle">
                    {editMode ? 'Update vendor information' : 'Fill in the vendor details below'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="vendor-premium-modal-close"
              >
                <X className="vendor-premium-close-icon" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="vendor-premium-modal-content">
              <form className="vendor-premium-form" onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="vendor-premium-form-section">
                  <h3 className="vendor-premium-section-title">
                    <Building className="vendor-premium-section-icon" />
                    Basic Information
                  </h3>
                  <div className="vendor-premium-form-grid">
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">
                        Vendor Name <span className="vendor-premium-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`vendor-premium-input ${formErrors.name ? 'vendor-premium-input-error' : ''}`}
                        placeholder="Enter vendor name"
                      />
                      {formErrors.name && (
                        <p className="vendor-premium-error-text">{formErrors.name}</p>
                      )}
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">
                        Company Name <span className="vendor-premium-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className={`vendor-premium-input ${formErrors.company ? 'vendor-premium-input-error' : ''}`}
                        placeholder="Enter company name"
                      />
                      {formErrors.company && (
                        <p className="vendor-premium-error-text">{formErrors.company}</p>
                      )}
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">
                        Email <span className="vendor-premium-required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`vendor-premium-input ${formErrors.email ? 'vendor-premium-input-error' : ''}`}
                        placeholder="vendor@company.com"
                      />
                      {formErrors.email && (
                        <p className="vendor-premium-error-text">{formErrors.email}</p>
                      )}
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">
                        Phone <span className="vendor-premium-required">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`vendor-premium-input ${formErrors.phone ? 'vendor-premium-input-error' : ''}`}
                        placeholder="+91 9876543210"
                      />
                      {formErrors.phone && (
                        <p className="vendor-premium-error-text">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="vendor-premium-form-section">
                  <h3 className="vendor-premium-section-title">
                    <MapPin className="vendor-premium-section-icon" />
                    Address
                  </h3>
                  <div className="vendor-premium-form-grid">
                    <div className="vendor-premium-form-field vendor-premium-field-full">
                      <label className="vendor-premium-label">Street</label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="City"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">State</label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="State"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Pincode</label>
                      <input
                        type="text"
                        name="address.pincode"
                        value={formData.address.pincode}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="123456"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Country</label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="vendor-premium-form-section">
                  <h3 className="vendor-premium-section-title">
                    <FileText className="vendor-premium-section-icon" />
                    Business Information
                  </h3>
                  <div className="vendor-premium-form-grid vendor-premium-grid-3">
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">GST Number</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">PAN Number</label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">License Number</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="License number"
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="vendor-premium-form-section">
                  <label className="vendor-premium-label">
                    Medicine Categories <span className="vendor-premium-required">*</span>
                  </label>
                  <div className="vendor-premium-categories-grid">
                    {categories.map(cat => (
                      <label
                        key={cat}
                        className={`vendor-premium-category-checkbox ${
                          formData.categories.includes(cat) ? 'vendor-premium-category-checked' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="vendor-premium-checkbox-input"
                        />
                        <span className="vendor-premium-category-label">{cat}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.categories && (
                    <p className="vendor-premium-error-text">{formErrors.categories}</p>
                  )}
                </div>

                {/* Payment Terms */}
                <div className="vendor-premium-form-section">
                  <h3 className="vendor-premium-section-title">
                    <CreditCard className="vendor-premium-section-icon" />
                    Payment Terms
                  </h3>
                  <div className="vendor-premium-form-grid vendor-premium-grid-3">
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Credit Days</label>
                      <input
                        type="number"
                        name="paymentTerms.creditDays"
                        value={formData.paymentTerms.creditDays}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        min="0"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Minimum Order (₹)</label>
                      <input
                        type="number"
                        name="paymentTerms.minimumOrderValue"
                        value={formData.paymentTerms.minimumOrderValue}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        min="0"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Discount (%)</label>
                      <input
                        type="number"
                        name="paymentTerms.discountPercentage"
                        value={formData.paymentTerms.discountPercentage}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="vendor-premium-form-section">
                  <h3 className="vendor-premium-section-title">
                    <User className="vendor-premium-section-icon" />
                    Contact Person
                  </h3>
                  <div className="vendor-premium-form-grid">
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Name</label>
                      <input
                        type="text"
                        name="contactPerson.name"
                        value={formData.contactPerson.name}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="Contact person name"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Designation</label>
                      <input
                        type="text"
                        name="contactPerson.designation"
                        value={formData.contactPerson.designation}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="Sales Manager"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Phone</label>
                      <input
                        type="tel"
                        name="contactPerson.phone"
                        value={formData.contactPerson.phone}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="vendor-premium-form-field">
                      <label className="vendor-premium-label">Email</label>
                      <input
                        type="email"
                        name="contactPerson.email"
                        value={formData.contactPerson.email}
                        onChange={handleInputChange}
                        className="vendor-premium-input"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="vendor-premium-form-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="vendor-premium-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="vendor-premium-submit-btn"
                  >
                    <Save className="vendor-premium-btn-icon" />
                    {loading ? 'Saving...' : editMode ? 'Update Vendor' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorManagement;