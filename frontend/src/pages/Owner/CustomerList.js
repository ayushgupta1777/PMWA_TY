// src/pages/Admin/CustomerList.js
import React, { useState, useEffect } from 'react';
import { Download, Search, Phone, User, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../../Styling/pages/Admin/CustomerList.css';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers?limit=1000`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
      );
    }

    setFilteredCustomers(filtered);
    setPage(1);
  };

  // ✅ Download as Excel
  const downloadExcel = () => {
    const data = filteredCustomers.map((customer, index) => ({
      'S.No': index + 1,
      'Name': customer.name,
      'Phone': customer.phone,
      'Total Purchases': customer.totalPurchases,
      'Total Spent': `₹${customer.totalSpent.toFixed(2)}`,
      'First Purchase': new Date(customer.firstPurchaseDate).toLocaleDateString(),
      'Last Purchase': new Date(customer.lastPurchaseDate).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `customers-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * limit,
    page * limit
  );

  const totalPages = Math.ceil(filteredCustomers.length / limit);

  if (loading) {
    return (
      <div className="customer-list-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-list-container">
      {/* Header */}
      <div className="customer-list-header">
        <div className="customer-list-header-content">
          <div>
            <h1 className="customer-list-title">Customer List</h1>
            <p className="customer-list-subtitle">
              View and manage all customers who have made purchases
            </p>
          </div>
          
          <button
            onClick={downloadExcel}
            className="customer-list-download-btn"
            disabled={filteredCustomers.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="customer-list-search">
        <div className="customer-list-search-icon">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="customer-list-search-input"
        />
      </div>

      {/* Stats */}
      <div className="customer-list-stats">
        <div className="customer-list-stat-card">
          <User className="w-5 h-5" />
          <div>
            <p className="stat-label">Total Customers</p>
            <p className="stat-value">{customers.length}</p>
          </div>
        </div>
        
        <div className="customer-list-stat-card">
          <ShoppingBag className="w-5 h-5" />
          <div>
            <p className="stat-label">Total Purchases</p>
            <p className="stat-value">
              {customers.reduce((sum, c) => sum + c.totalPurchases, 0)}
            </p>
          </div>
        </div>

        <div className="customer-list-stat-card">
          <DollarSign className="w-5 h-5" />
          <div>
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">
              ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="customer-list-table-wrapper">
        {filteredCustomers.length === 0 ? (
          <div className="customer-list-empty">
            <User className="w-12 h-12 opacity-20" />
            <p>No customers found</p>
          </div>
        ) : (
          <>
            <table className="customer-list-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                  <th>First Purchase</th>
                  <th>Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer, index) => (
                  <tr key={customer._id}>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>
                      <div className="customer-name">
                        <User className="w-4 h-4 text-blue-500" />
                        {customer.name}
                      </div>
                    </td>
                    <td>
                      <div className="customer-phone">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                    </td>
                    <td>{customer.totalPurchases}</td>
                    <td className="font-semibold text-green-600">
                      ₹{customer.totalSpent.toFixed(2)}
                    </td>
                    <td>
                      <div className="customer-date">
                        <Calendar className="w-4 h-4" />
                        {new Date(customer.firstPurchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="customer-date">
                        <Calendar className="w-4 h-4" />
                        {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="customer-list-pagination">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerList;