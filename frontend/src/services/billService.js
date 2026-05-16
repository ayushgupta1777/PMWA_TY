// src/services/billService.js - COMPLETE VERSION
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class BillService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
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
        console.error('Bill API Error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'An error occurred';
        throw new Error(errorMessage);
      }
    );
  }

  // Generate bill
  async generateBill(billData) {
    try {
      return await this.api.post('/bills/generate', billData);
    } catch (error) {
      console.error('Generate bill error:', error);
      throw error;
    }
  }

  // Get all bills (with pagination and filters)
  async getBills(params = {}) {
    try {
      return await this.api.get('/bills', { params });
    } catch (error) {
      console.error('Get bills error:', error);
      throw error;
    }
  }

  // Alias for getBills - for backward compatibility
  async getBillHistory(params = {}) {
    try {
      return await this.getBills(params);
    } catch (error) {
      console.error('Get bill history error:', error);
      throw error;
    }
  }

  // Get single bill
  async getBill(billId) {
    try {
      return await this.api.get(`/bills/${billId}`);
    } catch (error) {
      console.error('Get bill error:', error);
      throw error;
    }
  }

  // Get bill details (alias for getBill)
  async getBillDetails(billId) {
    try {
      return await this.getBill(billId);
    } catch (error) {
      console.error('Get bill details error:', error);
      throw error;
    }
  }

  // Get today's bills
  async getTodayBills() {
    try {
      return await this.api.get('/bills/today');
    } catch (error) {
      console.error('Get today bills error:', error);
      throw error;
    }
  }

  // Get bills by date range
  async getBillsByDateRange(startDate, endDate) {
    try {
      return await this.api.get('/bills/date-range', {
        params: { startDate, endDate }
      });
    } catch (error) {
      console.error('Get bills by date range error:', error);
      throw error;
    }
  }

  // Get bills summary/stats
  async getBillsStats() {
    try {
      return await this.api.get('/bills/stats');
    } catch (error) {
      console.error('Get bills stats error:', error);
      throw error;
    }
  }

  // Download bill
  async downloadBill(billId) {
    try {
      // Just get the bill data, not a blob
      return await this.api.get(`/bills/${billId}/download`);
    } catch (error) {
      console.error('Download bill error:', error);
      throw error;
    }
  }

  // Print bill (gets bill data for printing)
  async printBill(billId) {
    try {
      const response = await this.api.get(`/bills/${billId}`);
      return response;
    } catch (error) {
      console.error('Print bill error:', error);
      throw error;
    }
  }

  // Generate PDF/Print HTML for bill
  generateBillHTML(billData) {
    const bill = billData.bill || billData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${bill.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 12px;
            color: #666;
          }
          .customer-details {
            margin-bottom: 20px;
            padding: 10px;
            background: #f9f9f9;
            border: 1px solid #ddd;
          }
          .customer-details p {
            font-size: 14px;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          thead {
            background: #f0f0f0;
            border-bottom: 2px solid #000;
          }
          th, td {
            padding: 10px;
            text-align: left;
            font-size: 12px;
            border-bottom: 1px solid #ddd;
          }
          th {
            font-weight: bold;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals {
            margin-left: auto;
            width: 300px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .grand-total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
            font-size: 16px;
            font-weight: bold;
          }
          .payment-method {
            margin-top: 20px;
            padding: 10px;
            background: #f9f9f9;
            border: 1px solid #ddd;
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .product-details {
            font-size: 11px;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PHARMACY INVOICE</h1>
          <p>Invoice No: ${bill.invoiceNumber} | Date: ${new Date(bill.date).toLocaleDateString()}</p>
        </div>

        <div class="customer-details">
          <p><strong>Customer:</strong> ${bill.customerName}</p>
          <p><strong>Phone:</strong> ${bill.customerPhone}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Product</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${item.name || item.tablet?.name}</strong>
                  <div class="product-details">
                    ${item.brand || item.tablet?.brand} • ${item.strength || item.tablet?.strength}
                    ${item.displayText ? `<br>(${item.displayText})` : ''}
                  </div>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₹${item.priceAtTime.toFixed(2)}</td>
                <td class="text-right">₹${item.calculatedPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>SUB TOTAL</span>
            <span>₹${bill.subtotal.toFixed(2)}</span>
          </div>
          ${bill.discount > 0 ? `
            <div class="totals-row" style="color: #059669;">
              <span>Discount ${bill.discountPercentage}%</span>
              <span>- ₹${bill.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="totals-row grand-total">
            <span>GRAND TOTAL</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="payment-method">
          <strong>Payment Method:</strong> ${bill.paymentMethod.toUpperCase()}
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Download bill as HTML file
  async downloadBillAsHTML(billId, filename) {
    try {
      const response = await this.api.get(`/bills/${billId}`);
      const html = this.generateBillHTML(response);
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `invoice-${response.bill.invoiceNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Download bill as HTML error:', error);
      throw error;
    }
  }

  // Print bill directly
  async printBillDirect(billId) {
    try {
      const response = await this.api.get(`/bills/${billId}`);
      const html = this.generateBillHTML(response);
      
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
      return { success: true };
    } catch (error) {
      console.error('Print bill direct error:', error);
      throw error;
    }
  }

  // Search bills
  async searchBills(searchTerm, params = {}) {
    try {
      return await this.api.get('/bills/search', {
        params: { q: searchTerm, ...params }
      });
    } catch (error) {
      console.error('Search bills error:', error);
      throw error;
    }
  }

  // Get bills for a specific customer
  async getCustomerBills(customerPhone) {
    try {
      return await this.api.get('/bills/customer', {
        params: { phone: customerPhone }
      });
    } catch (error) {
      console.error('Get customer bills error:', error);
      throw error;
    }
  }

  // Cancel/void a bill (if needed)
  async cancelBill(billId, reason) {
    try {
      return await this.api.put(`/bills/${billId}/cancel`, { reason });
    } catch (error) {
      console.error('Cancel bill error:', error);
      throw error;
    }
  }

  // Get monthly report
  async getMonthlyReport(year, month) {
    try {
      return await this.api.get('/bills/report/monthly', {
        params: { year, month }
      });
    } catch (error) {
      console.error('Get monthly report error:', error);
      throw error;
    }
  }

  // Get daily report
  async getDailyReport(date) {
    try {
      return await this.api.get('/bills/report/daily', {
        params: { date }
      });
    } catch (error) {
      console.error('Get daily report error:', error);
      throw error;
    }
  }

  // Export bills to CSV/Excel (if you implement this)
  async exportBills(params = {}) {
    try {
      return await this.api.get('/bills/export', {
        params,
        responseType: 'blob'
      });
    } catch (error) {
      console.error('Export bills error:', error);
      throw error;
    }
  }
}

export const billService = new BillService();