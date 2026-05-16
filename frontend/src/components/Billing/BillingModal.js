import React, { useState, useRef } from 'react';
import { X, CreditCard, Printer, DollarSign, User, Phone, Percent, Edit2 } from 'lucide-react';
import { billService } from '../../services/billService';

const BillingModal = ({ cart, onClose, onBillGenerated }) => {
  // ✅ CHANGED: Name and phone are now optional
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedBill, setGeneratedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // ✅ NEW: Per-item discounts
  const [itemDiscounts, setItemDiscounts] = useState({});
  
  const billRef = useRef(null);

  // ✅ NEW: Handle discount change for each item
  const handleDiscountChange = (itemIndex, discount) => {
    const discountValue = Math.min(Math.max(parseFloat(discount) || 0, 0), 100);
    setItemDiscounts(prev => ({
      ...prev,
      [itemIndex]: discountValue
    }));
  };

  // ✅ UPDATED: Calculate totals with per-item discounts
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;

    cart?.items?.forEach((item, index) => {
      const itemPrice = item.calculatedPrice || (item.tablet.packaging?.unitPrice * item.quantity);
      subtotal += itemPrice;

      const discount = itemDiscounts[index] || 0;
      const discountAmount = itemPrice * (discount / 100);
      totalDiscount += discountAmount;
    });

    const total = subtotal - totalDiscount;

    return {
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ CHANGED: Phone validation is now optional
    if (customerPhone && customerPhone.length !== 10) {
      setError('Phone number must be 10 digits (or leave blank)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const billData = {
        customerName: customerName.trim() || 'Walk-in Customer', // ✅ Default name
        customerPhone: customerPhone.trim() || null, // ✅ Optional phone
        paymentMethod,
        items: cart.items.map((item, index) => ({
          tablet: item.tablet._id,
          quantity: item.quantity,
          price: item.calculatedPrice || (item.tablet.packaging?.unitPrice * item.quantity),
          discountPercentage: itemDiscounts[index] || 0 // ✅ Per-item discount
        }))
      };

      const response = await billService.generateBill(billData);
      setGeneratedBill(response.bill);

      if (onBillGenerated) {
        onBillGenerated();
      }
    } catch (error) {
      console.error('Bill generation error:', error);
      setError(error.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = billRef.current;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const totals = calculateTotals();

  // ✅ SHOW BILL AFTER GENERATION
  if (generatedBill) {
    return (
      <div className="billing-modal-overlay">
        <div className="billing-modal-container" style={{ maxWidth: '900px' }}>
          <div className="billing-modal-header">
            <h2>Invoice Generated</h2>
            <button onClick={onClose} className="billing-modal-close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="billing-modal-body" style={{ padding: '0' }}>
            <div ref={billRef} style={{
              padding: '40px',
              background: 'white',
              fontFamily: 'Arial, sans-serif'
            }}>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                borderBottom: '2px solid #000',
                paddingBottom: '15px',
                marginBottom: '20px'
              }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  PHARMACY INVOICE
                </h1>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Invoice No: {generatedBill.invoiceNumber} | Date: {new Date(generatedBill.date).toLocaleDateString()}
                </p>
              </div>

              {/* Customer Details */}
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                background: '#f9f9f9',
                border: '1px solid #ddd'
              }}>
                <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                  <strong>Customer:</strong> {generatedBill.customerName}
                </p>
                {generatedBill.customerPhone && (
                  <p style={{ fontSize: '14px' }}>
                    <strong>Phone:</strong> {generatedBill.customerPhone}
                  </p>
                )}
              </div>

              {/* Items Table */}
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '20px'
              }}>
                <thead>
                  <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #000' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>S.No.</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>Qty</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px' }}>Rate</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>Discount %</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedBill.items.map((item, index) => {
                    const discountAmount = item.calculatedPrice * (item.discountPercentage / 100);
                    const finalPrice = item.calculatedPrice - discountAmount;
                    return (
                      <tr key={item._id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px', fontSize: '12px' }}>{index + 1}</td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>
                          <div>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {item.brand} • {item.strength}
                            </div>
                            {item.displayText && (
                              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                ({item.displayText})
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px' }}>
                          ₹{item.priceAtTime.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                          {item.discountPercentage}%
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px' }}>
                          ₹{finalPrice.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ marginLeft: 'auto', width: '300px', borderTop: '2px solid #000', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span>SUB TOTAL</span>
                  <span>₹{generatedBill.subtotal.toFixed(2)}</span>
                </div>

                {generatedBill.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#059669' }}>
                    <span>Total Discount</span>
                    <span>- ₹{generatedBill.totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #000', fontSize: '16px', fontWeight: 'bold' }}>
                  <span>GRAND TOTAL</span>
                  <span>₹{generatedBill.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginTop: '20px', padding: '10px', background: '#f9f9f9', border: '1px solid #ddd', fontSize: '12px' }}>
                <strong>Payment Method:</strong> {generatedBill.paymentMethod.toUpperCase()}
              </div>

              {/* Footer */}
              <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                <p>Thank you for your business!</p>
                <p style={{ marginTop: '5px' }}>Generated on {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="billing-modal-footer" style={{ gap: '10px' }}>
            <button onClick={handlePrint} className="billing-modal-button billing-modal-button-secondary">
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            <button onClick={onClose} className="billing-modal-button billing-modal-button-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-modal-overlay">
      <div className="billing-modal-container">
        <div className="billing-modal-header">
          <h2>Generate Bill</h2>
          <button onClick={onClose} className="billing-modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="billing-modal-body">
            {error && (
              <div className="billing-modal-error">
                {error}
              </div>
            )}

            {/* Customer Details - Optional */}
            <div className="billing-modal-form-group">
              <label>Customer Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Leave blank for Walk-in Customer"
              />
            </div>

            <div className="billing-modal-form-group">
              <label>Customer Phone (Optional)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Leave blank if not available"
              />
            </div>

            <div className="billing-modal-form-group">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {/* ✅ NEW: Per-Item Discounts */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
                <Percent className="w-4 h-4 inline mr-2" />
                Item Discounts (%)
              </h3>

              {cart?.items?.map((item, index) => {
                const itemTotal = item.calculatedPrice || (item.tablet.packaging?.unitPrice * item.quantity);
                const discount = itemDiscounts[index] || 0;
                const discountAmount = itemTotal * (discount / 100);
                const finalPrice = itemTotal - discountAmount;

                return (
                  <div key={index} style={{
                    marginBottom: '15px',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <strong>{item.tablet.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {item.quantity} × ₹{(item.tablet.packaging?.unitPrice || 0).toFixed(2)} = ₹{itemTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ width: '100px', fontSize: '12px' }}>Discount %:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={discount}
                        onChange={(e) => handleDiscountChange(index, e.target.value)}
                        style={{
                          width: '80px',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        = ₹{discountAmount.toFixed(2)} off
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: 'auto' }}>
                        Final: ₹{finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="billing-modal-summary" style={{ marginTop: '20px' }}>
              <h3>Order Summary</h3>
              <div className="billing-modal-summary-row">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal}</span>
              </div>
              {parseFloat(totals.totalDiscount) > 0 && (
                <div className="billing-modal-summary-row" style={{ color: '#059669' }}>
                  <span>Total Discount:</span>
                  <span>- ₹{totals.totalDiscount}</span>
                </div>
              )}
              <div className="billing-modal-summary-row billing-modal-summary-total">
                <span>Total:</span>
                <span>₹{totals.total}</span>
              </div>
            </div>
          </div>

          <div className="billing-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="billing-modal-button billing-modal-button-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="billing-modal-button billing-modal-button-primary"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingModal;

// import React, { useState, useRef } from 'react';
// import { X, CreditCard, Printer, DollarSign, User, Phone, Mail, FileText, Download } from 'lucide-react';
// import { billService } from '../../services/billService';

// const BillingModal = ({ cart, onClose, onBillGenerated }) => {
//   const [customerName, setCustomerName] = useState('');
//   const [customerPhone, setCustomerPhone] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [discount, setDiscount] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [generatedBill, setGeneratedBill] = useState(null);
//   const billRef = useRef(null);

//   const calculateTotals = () => {
//     const subtotal = cart?.totalAmount || 0;
//     const discountAmount = subtotal * (discount / 100);
//     const total = subtotal - discountAmount;
    
//     return {
//       subtotal: subtotal.toFixed(2),
//       discount: discountAmount.toFixed(2),
//       total: total.toFixed(2)
//     };
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!customerName.trim()) {
//       setError('Customer name is required');
//       return;
//     }

//     if (!customerPhone.trim()) {
//       setError('Customer phone is required');
//       return;
//     }

//     if (customerPhone.length !== 10) {
//       setError('Phone number must be 10 digits');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');

//       const billData = {
//         customerName: customerName.trim(),
//         customerPhone: customerPhone.trim(),
//         paymentMethod,
//         discount: parseFloat(discount) || 0,
//         items: cart.items.map(item => ({
//           tablet: item.tablet._id,
//           quantity: item.quantity,
//           price: item.calculatedPrice || (item.tablet.packaging?.unitPrice * item.quantity)
//         }))
//       };

//       const response = await billService.generateBill(billData);
//       setGeneratedBill(response.bill);
      
//       // Call onBillGenerated to clear cart
//       if (onBillGenerated) {
//         onBillGenerated();
//       }
//     } catch (error) {
//       console.error('Bill generation error:', error);
//       setError(error.message || 'Failed to generate bill');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePrint = () => {
//     const printContent = billRef.current;
//     const printWindow = window.open('', '', 'width=800,height=600');
//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>Invoice</title>
//           <style>
//             * { margin: 0; padding: 0; box-sizing: border-box; }
//             body { font-family: Arial, sans-serif; padding: 20px; }
//             @media print {
//               body { padding: 0; }
//               .no-print { display: none !important; }
//             }
//           </style>
//         </head>
//         <body>
//           ${printContent.innerHTML}
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//     printWindow.focus();
//     setTimeout(() => {
//       printWindow.print();
//       printWindow.close();
//     }, 250);
//   };

//   const totals = calculateTotals();

//   if (generatedBill) {
//     return (
//       <div className="billing-modal-overlay">
//         <div className="billing-modal-container" style={{maxWidth: '900px'}}>
//           <div className="billing-modal-header">
//             <h2>Invoice Generated</h2>
//             <button onClick={onClose} className="billing-modal-close">
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="billing-modal-body" style={{padding: '0'}}>
//             {/* INVOICE */}
//             <div ref={billRef} style={{
//               padding: '40px',
//               background: 'white',
//               fontFamily: 'Arial, sans-serif'
//             }}>
//               {/* Header */}
//               <div style={{
//                 textAlign: 'center',
//                 borderBottom: '2px solid #000',
//                 paddingBottom: '15px',
//                 marginBottom: '20px'
//               }}>
//                 <h1 style={{
//                   fontSize: '24px',
//                   fontWeight: 'bold',
//                   marginBottom: '5px'
//                 }}>PHARMACY INVOICE</h1>
//                 <p style={{fontSize: '12px', color: '#666'}}>
//                   Invoice No: {generatedBill.invoiceNumber} | Date: {new Date(generatedBill.date).toLocaleDateString()}
//                 </p>
//               </div>

//               {/* Customer Details */}
//               <div style={{
//                 marginBottom: '20px',
//                 padding: '10px',
//                 background: '#f9f9f9',
//                 border: '1px solid #ddd'
//               }}>
//                 <p style={{fontSize: '14px', marginBottom: '5px'}}>
//                   <strong>Customer:</strong> {generatedBill.customerName}
//                 </p>
//                 <p style={{fontSize: '14px'}}>
//                   <strong>Phone:</strong> {generatedBill.customerPhone}
//                 </p>
//               </div>

//               {/* Items Table */}
//               <table style={{
//                 width: '100%',
//                 borderCollapse: 'collapse',
//                 marginBottom: '20px'
//               }}>
//                 <thead>
//                   <tr style={{background: '#f0f0f0', borderBottom: '2px solid #000'}}>
//                     <th style={{padding: '10px', textAlign: 'left', fontSize: '12px'}}>S.No.</th>
//                     <th style={{padding: '10px', textAlign: 'left', fontSize: '12px'}}>Product</th>
//                     <th style={{padding: '10px', textAlign: 'center', fontSize: '12px'}}>Qty</th>
//                     <th style={{padding: '10px', textAlign: 'right', fontSize: '12px'}}>Rate</th>
//                     <th style={{padding: '10px', textAlign: 'right', fontSize: '12px'}}>Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {generatedBill.items.map((item, index) => {
//                     const unitPrice = item.tablet?.packaging?.unitPrice || item.priceAtTime;
//                     return (
//                       <tr key={item._id} style={{borderBottom: '1px solid #ddd'}}>
//                         <td style={{padding: '10px', fontSize: '12px'}}>{index + 1}</td>
//                         <td style={{padding: '10px', fontSize: '12px'}}>
//                           <div>
//                             <strong>{item.tablet?.name}</strong>
//                             <div style={{fontSize: '11px', color: '#666'}}>
//                               {item.tablet?.brand} • {item.tablet?.strength}
//                             </div>
//                             {item.displayText && (
//                               <div style={{fontSize: '10px', color: '#888', marginTop: '2px'}}>
//                                 ({item.displayText})
//                               </div>
//                             )}
//                           </div>
//                         </td>
//                         <td style={{padding: '10px', textAlign: 'center', fontSize: '12px'}}>
//                           {item.quantity}
//                         </td>
//                         <td style={{padding: '10px', textAlign: 'right', fontSize: '12px'}}>
//                           ₹{unitPrice.toFixed(2)}
//                         </td>
//                         <td style={{padding: '10px', textAlign: 'right', fontSize: '12px'}}>
//                           ₹{item.calculatedPrice.toFixed(2)}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>

//               {/* Totals */}
//               <div style={{
//                 marginLeft: 'auto',
//                 width: '300px',
//                 borderTop: '2px solid #000',
//                 paddingTop: '10px'
//               }}>
//                 <div style={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   marginBottom: '8px',
//                   fontSize: '13px'
//                 }}>
//                   <span>SUB TOTAL</span>
//                   <span>₹{generatedBill.subtotal.toFixed(2)}</span>
//                 </div>
                
//                 {generatedBill.discount > 0 && (
//                   <div style={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     marginBottom: '8px',
//                     fontSize: '13px',
//                     color: '#059669'
//                   }}>
//                     <span>Discount {generatedBill.discountPercentage}%</span>
//                     <span>- ₹{generatedBill.discount.toFixed(2)}</span>
//                   </div>
//                 )}
                
//                 <div style={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   marginTop: '10px',
//                   paddingTop: '10px',
//                   borderTop: '2px solid #000',
//                   fontSize: '16px',
//                   fontWeight: 'bold'
//                 }}>
//                   <span>GRAND TOTAL</span>
//                   <span>₹{generatedBill.total.toFixed(2)}</span>
//                 </div>
//               </div>

//               {/* Payment Method */}
//               <div style={{
//                 marginTop: '20px',
//                 padding: '10px',
//                 background: '#f9f9f9',
//                 border: '1px solid #ddd',
//                 fontSize: '12px'
//               }}>
//                 <strong>Payment Method:</strong> {generatedBill.paymentMethod.toUpperCase()}
//               </div>

//               {/* Footer */}
//               <div style={{
//                 marginTop: '30px',
//                 textAlign: 'center',
//                 fontSize: '11px',
//                 color: '#666',
//                 borderTop: '1px solid #ddd',
//                 paddingTop: '15px'
//               }}>
//                 <p>Thank you for your business!</p>
//                 <p style={{marginTop: '5px'}}>
//                   Generated on {new Date().toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="billing-modal-footer" style={{gap: '10px'}}>
//             <button
//               onClick={handlePrint}
//               className="billing-modal-button billing-modal-button-secondary"
//             >
//               <Printer className="w-4 h-4" />
//               Print Invoice
//             </button>
//             <button
//               onClick={onClose}
//               className="billing-modal-button billing-modal-button-primary"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="billing-modal-overlay">
//       <div className="billing-modal-container">
//         <div className="billing-modal-header">
//           <h2>Generate Bill</h2>
//           <button onClick={onClose} className="billing-modal-close">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="billing-modal-body">
//             {error && (
//               <div className="billing-modal-error">
//                 {error}
//               </div>
//             )}

//             <div className="billing-modal-form-group">
//               <label>Customer Name *</label>
//               <input
//                 type="text"
//                 value={customerName}
//                 onChange={(e) => setCustomerName(e.target.value)}
//                 placeholder="Enter customer name"
//                 required
//               />
//             </div>

//             <div className="billing-modal-form-group">
//               <label>Customer Phone *</label>
//               <input
//                 type="tel"
//                 value={customerPhone}
//                 onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
//                 placeholder="Enter 10-digit phone number"
//                 required
//               />
//             </div>

//             <div className="billing-modal-form-group">
//               <label>Payment Method</label>
//               <select
//                 value={paymentMethod}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//               >
//                 <option value="cash">Cash</option>
//                 <option value="card">Card</option>
//                 <option value="upi">UPI</option>
//               </select>
//             </div>

//             <div className="billing-modal-form-group">
//               <label>Discount (%)</label>
//               <input
//                 type="number"
//                 min="0"
//                 max="100"
//                 step="0.1"
//                 value={discount}
//                 onChange={(e) => setDiscount(e.target.value)}
//                 placeholder="Enter discount percentage"
//               />
//             </div>

//             <div className="billing-modal-summary">
//               <h3>Order Summary</h3>
//               <div className="billing-modal-summary-row">
//                 <span>Subtotal:</span>
//                 <span>₹{totals.subtotal}</span>
//               </div>
//               {discount > 0 && (
//                 <div className="billing-modal-summary-row" style={{color: '#059669'}}>
//                   <span>Discount ({discount}%):</span>
//                   <span>- ₹{totals.discount}</span>
//                 </div>
//               )}
//               <div className="billing-modal-summary-row billing-modal-summary-total">
//                 <span>Total:</span>
//                 <span>₹{totals.total}</span>
//               </div>
//             </div>
//           </div>

//           <div className="billing-modal-footer">
//             <button
//               type="button"
//               onClick={onClose}
//               className="billing-modal-button billing-modal-button-secondary"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="billing-modal-button billing-modal-button-primary"
//               disabled={loading}
//             >
//               {loading ? 'Generating...' : 'Generate Bill'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default BillingModal;