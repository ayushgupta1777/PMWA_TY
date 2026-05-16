// src/pages/Owner/ManageTablets.js - FIXED VERSION
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';


import { 
  Plus, Search, Edit, Trash2, Package, Upload, Download,
  AlertTriangle, CheckCircle, X, Building2, DollarSign, Box
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ownerService } from '../../services/ownerService';
import '../../Styling/pages/Owner/ManageTabletsPremium.css';

const ManageTablets = () => {
  const [tablets, setTablets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTablet, setEditingTablet] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  });

  useEffect(() => {
    fetchTablets();
    fetchVendors();
  }, [searchQuery, filters, pagination.page]);

  const fetchTablets = async () => {
    try {
      setLoading(true);
      const data = await ownerService.getAllMedicines({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        category: filters.category,
        stockStatus: filters.stockStatus
      });

      setTablets(data.medicines || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error('Failed to fetch tablets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/vendors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const handleDeleteTablet = async (tabletId, tabletName) => {
    if (window.confirm(`Are you sure you want to delete ${tabletName}?`)) {
      try {
        await ownerService.deleteMedicine(tabletId);
        fetchTablets();
      } catch (error) {
        console.error('Failed to delete tablet:', error);
      }
    }
  };

  const getStockStatusBadge = (tablet) => {
    const packaging = tablet.packaging || { unitsPerPack: 1 };
    const totalUnits = (tablet.stock * packaging.unitsPerPack) + (tablet.looseUnits || 0);
    
    if (totalUnits === 0) {
      return <span className="tablets-premium-badge tablets-premium-badge-danger">Out of Stock</span>;
    }
    if (tablet.stock <= (tablet.minStockLevel || 10)) {
      return <span className="tablets-premium-badge tablets-premium-badge-warning">Low Stock</span>;
    }
    return <span className="tablets-premium-badge tablets-premium-badge-success">In Stock</span>;
  };

  return (
    <div className="tablets-premium-container">
      {/* Header */}
      <div className="tablets-premium-header">
        <div className="tablets-premium-header-content">
          <div className="tablets-premium-header-top">
            <div className="tablets-premium-header-text">
              <h1 className="tablets-premium-title">Manage Medicines</h1>
              <p className="tablets-premium-subtitle">
                Add, edit, and manage your medicine inventory with packaging details
              </p>
            </div>
            <div className="tablets-premium-header-actions">
              <button
                onClick={() => setShowAddModal(true)}
                className="tablets-premium-btn tablets-premium-btn-primary"
              >
                <Plus className="tablets-premium-btn-icon" />
                <span>Add Medicine</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="tablets-premium-filters">
            <div className="tablets-premium-search-wrapper">
              <div className="tablets-premium-search-icon">
                <Search className="tablets-premium-icon" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tablets-premium-search-input"
                placeholder="Search medicines..."
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="tablets-premium-select"
            >
              <option value="">All Categories</option>
              <option value="Pain Relief">Pain Relief</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Vitamin">Vitamin</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Cardio">Cardio</option>
            </select>

            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
              className="tablets-premium-select"
            >
              <option value="">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tablets Table */}
      <div className="tablets-premium-main">
        {loading ? (
          <div className="tablets-premium-loading">
            <div className="tablets-premium-spinner"></div>
          </div>
        ) : tablets.length === 0 ? (
          <div className="tablets-premium-empty">
            <Package className="tablets-premium-empty-icon" />
            <h3 className="tablets-premium-empty-title">No medicines found</h3>
            <p className="tablets-premium-empty-text">Get started by adding your first medicine</p>
          </div>
        ) : (
          <>
            <div className="tablets-premium-table-wrapper">
              <table className="tablets-premium-table">
                <thead className="tablets-premium-thead">
                  <tr>
                    <th className="tablets-premium-th">Medicine</th>
                    <th className="tablets-premium-th">Packaging</th>
                    <th className="tablets-premium-th">Pricing</th>
                    <th className="tablets-premium-th">Stock</th>
                    <th className="tablets-premium-th">Vendor</th>
                    <th className="tablets-premium-th">Status</th>
                    <th className="tablets-premium-th tablets-premium-th-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="tablets-premium-tbody">
                  {tablets.map((tablet) => {
                    const packaging = tablet.packaging || {
                      packType: 'Strip',
                      unitsPerPack: 1,
                      unitType: 'Unit',
                      packPrice: tablet.price || 0,
                      unitPrice: tablet.price || 0
                    };
                    const totalUnits = (tablet.stock * packaging.unitsPerPack) + (tablet.looseUnits || 0);
                    
                    return (
                      <tr key={tablet._id} className="tablets-premium-tr">
                        <td className="tablets-premium-td">
                          <div className="tablets-premium-medicine-info">
                            <div className="tablets-premium-medicine-name">{tablet.name}</div>
                            <div className="tablets-premium-medicine-meta">
                              {tablet.brand} • {tablet.company} • {tablet.strength}
                            </div>
                          </div>
                        </td>
                        <td className="tablets-premium-td">
                          <div className="tablets-premium-pack-info">
                            <div className="tablets-premium-pack-type">
                              <Box className="w-3 h-3" />
                              {packaging.packType}
                            </div>
                            <div className="tablets-premium-pack-units">
                              {packaging.unitsPerPack} {packaging.unitType}{packaging.unitsPerPack > 1 ? 's' : ''}/pack
                            </div>
                          </div>
                        </td>
                        <td className="tablets-premium-td">
                          <div className="tablets-premium-pricing-info">
                            <div className="tablets-premium-pack-price">
                              Pack: ₹{packaging.packPrice?.toFixed(2) || '0.00'}
                            </div>
                            <div className="tablets-premium-unit-price">
                              Unit: ₹{packaging.unitPrice?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </td>
                        <td className="tablets-premium-td">
                          <div className="tablets-premium-stock-info">
                            <div className="tablets-premium-stock-value">
                              {/* {tablet.stock}  */}
                              packs
                            </div>
                            {tablet.looseUnits > 0 && (
                              <div className="tablets-premium-stock-loose">
                                +{tablet.looseUnits} loose
                              </div>
                            )}
                            <div className="tablets-premium-stock-total">
                              ({totalUnits} units total)
                            </div>
                          </div>
                        </td>
                        <td className="tablets-premium-td">
                          <div className="tablets-premium-vendor-info">
                            {tablet.suppliers && tablet.suppliers.length > 0 ? (
                              <>
                                <div className="tablets-premium-vendor-primary">
                                  {tablet.suppliers[0].vendorName || 'Vendor'}
                                </div>
                                {tablet.suppliers.length > 1 && (
                                  <div className="tablets-premium-vendor-count">
                                    +{tablet.suppliers.length - 1} more
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="tablets-premium-vendor-none">No vendor</span>
                            )}
                          </div>
                        </td>
                        <td className="tablets-premium-td">{getStockStatusBadge(tablet)}</td>
                        <td className="tablets-premium-td tablets-premium-td-actions">
                          <button
                            onClick={() => setEditingTablet(tablet)}
                            className="tablets-premium-action-btn tablets-premium-action-btn-edit"
                          >
                            <Edit className="tablets-premium-action-icon" />
                          </button>
                          <button
                            onClick={() => handleDeleteTablet(tablet._id, tablet.name)}
                            className="tablets-premium-action-btn tablets-premium-action-btn-delete"
                          >
                            <Trash2 className="tablets-premium-action-icon" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="tablets-premium-pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="tablets-premium-pagination-btn"
                >
                  Previous
                </button>
                <span className="tablets-premium-pagination-text">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="tablets-premium-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingTablet) && (
        <MedicineFormModal
          medicine={editingTablet}
          vendors={vendors}
          onClose={() => {
            setShowAddModal(false);
            setEditingTablet(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingTablet(null);
            fetchTablets();
          }}
        />
      )}
    </div>
  );
};

// ⭐ FIXED FORM MODAL


// const MedicineFormModal = ({ medicine, vendors, onClose, onSuccess }) => {
//   // ✅ FIX: Initialize with default packaging values
//   const [formData, setFormData] = useState({
//     name: medicine?.name || '',
//     brand: medicine?.brand || '',
//     company: medicine?.company || '',
//     strength: medicine?.strength || '',
//     category: medicine?.category || 'General',
//     description: medicine?.description || '',
    
//     // ✅ FIX: Default packaging object
//     packaging: medicine?.packaging || {
//       packType: 'Strip',
//       unitsPerPack: 10,
//       unitType: 'Tablet',
//       packPrice: '',
//       unitPrice: '',
//       canSellByPack: true,
//       canSellByUnit: true
//     },
    
//     stock: medicine?.stock || '',
//     looseUnits: medicine?.looseUnits || 0,
//     minStockLevel: medicine?.minStockLevel || 10,
//     maxStockLevel: medicine?.maxStockLevel || 500,
    
//     suppliers: medicine?.suppliers || [],
    
//     dosageForm: medicine?.dosageForm || 'Tablet'
//   });
  
//   const [selectedVendors, setSelectedVendors] = useState(
//     medicine?.suppliers?.map(s => s.vendor) || []
//   );
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');




  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError('');

  //   try {
  //     // Prepare suppliers data
  //     const suppliersData = selectedVendors.map((vendorId, index) => {
  //       const vendor = vendors.find(v => v._id === vendorId);
  //       return {
  //         vendor: vendorId,
  //         vendorName: vendor?.name || '',
  //         supplierPrice: 0, // You can add a field for this later
  //         isPreferred: index === 0,
  //         addedAt: new Date()
  //       };
  //     });

  //     const dataToSend = {
  //       ...formData,
  //       suppliers: suppliersData,
  //       packaging: {
  //         ...formData.packaging,
  //         packPrice: parseFloat(formData.packaging.packPrice) || 0,
  //         unitPrice: parseFloat(formData.packaging.unitPrice) || 0,
  //         unitsPerPack: parseInt(formData.packaging.unitsPerPack) || 1
  //       },
  //       stock: parseInt(formData.stock) || 0,
  //       looseUnits: parseInt(formData.looseUnits) || 0
  //     };

  //     if (medicine) {
  //       await ownerService.updateMedicine(medicine._id, dataToSend);
  //     } else {
  //       await ownerService.createMedicine(dataToSend);
  //     }
  //     onSuccess();
  //   } catch (error) {
  //     setError(error.response?.data?.message || 'Failed to save medicine');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
// src/pages/Owner/ManageTablets.js - REPLACE MedicineFormModal component

const MedicineFormModal = ({ medicine, vendors, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: medicine?.name || '',
    brand: medicine?.brand || '',
    company: medicine?.company || '',
    strength: medicine?.strength || '',
    category: medicine?.category || 'General',
    description: medicine?.description || '',
    
    // ✅ NEW PRICING STRUCTURE
    pricing: {
      perTablet: medicine?.pricing?.perTablet || '',
      strip: {
        tabletsPerStrip: medicine?.pricing?.strip?.tabletsPerStrip || 10,
        stripPrice: medicine?.pricing?.strip?.stripPrice || ''
      },
      box: {
        stripsPerBox: medicine?.pricing?.box?.stripsPerBox || 10,
        boxPrice: medicine?.pricing?.box?.boxPrice || ''
      }
    },
    
    // ✅ NEW STOCK STRUCTURE
    stock: {
      boxes: medicine?.stock?.boxes || 0,
      strips: medicine?.stock?.strips || 0,
      looseTablets: medicine?.stock?.looseTablets || 0
    },
    
    suppliers: medicine?.suppliers || [],
    dosageForm: medicine?.dosageForm || 'Tablet'
  });

  const [selectedVendors, setSelectedVendors] = useState(
    medicine?.suppliers?.map(s => s.vendor) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Calculate strip savings
  const stripSavings = useMemo(() => {
    const perTablet = parseFloat(formData.pricing.perTablet) || 0;
    const tabletsPerStrip = parseInt(formData.pricing.strip.tabletsPerStrip) || 0;
    const stripPrice = parseFloat(formData.pricing.strip.stripPrice) || 0;
    
    if (perTablet > 0 && tabletsPerStrip > 0 && stripPrice > 0) {
      const individualCost = perTablet * tabletsPerStrip;
      const savings = individualCost - stripPrice;
      const savingsPercent = (savings / individualCost) * 100;
      return {
        savings: savings.toFixed(2),
        percent: savingsPercent.toFixed(1),
        individualCost: individualCost.toFixed(2)
      };
    }
    return null;
  }, [formData.pricing.perTablet, formData.pricing.strip.tabletsPerStrip, formData.pricing.strip.stripPrice]);

  // ✅ Calculate box savings
  const boxSavings = useMemo(() => {
    const stripPrice = parseFloat(formData.pricing.strip.stripPrice) || 0;
    const stripsPerBox = parseInt(formData.pricing.box.stripsPerBox) || 0;
    const boxPrice = parseFloat(formData.pricing.box.boxPrice) || 0;
    
    if (stripPrice > 0 && stripsPerBox > 0 && boxPrice > 0) {
      const stripsCost = stripPrice * stripsPerBox;
      const savings = stripsCost - boxPrice;
      const savingsPercent = (savings / stripsCost) * 100;
      return {
        savings: savings.toFixed(2),
        percent: savingsPercent.toFixed(1),
        stripsCost: stripsCost.toFixed(2)
      };
    }
    return null;
  }, [formData.pricing.strip.stripPrice, formData.pricing.box.stripsPerBox, formData.pricing.box.boxPrice]);

  // Auto-calculate unit price when pack price or units per pack changes
  const handlePackPriceChange = (packPrice, unitsPerPack) => {
    const unitPrice = packPrice && unitsPerPack ? (packPrice / unitsPerPack).toFixed(2) : '';
    setFormData(prev => ({
      ...prev,
      packaging: {
        ...prev.packaging,
        packPrice: packPrice,
        unitsPerPack: unitsPerPack,
        unitPrice: unitPrice
      }
    }));
  };
  // ✅ Calculate total tablets
  const totalTablets = useMemo(() => {
    const tabletsPerStrip = parseInt(formData.pricing.strip.tabletsPerStrip) || 10;
    const stripsPerBox = parseInt(formData.pricing.box.stripsPerBox) || 10;
    
    const fromBoxes = (parseInt(formData.stock.boxes) || 0) * stripsPerBox * tabletsPerStrip;
    const fromStrips = (parseInt(formData.stock.strips) || 0) * tabletsPerStrip;
    const loose = parseInt(formData.stock.looseTablets) || 0;
    
    return fromBoxes + fromStrips + loose;
  }, [formData.stock, formData.pricing.strip.tabletsPerStrip, formData.pricing.box.stripsPerBox]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        pricing: {
          perTablet: parseFloat(formData.pricing.perTablet),
          strip: {
            tabletsPerStrip: parseInt(formData.pricing.strip.tabletsPerStrip),
            stripPrice: parseFloat(formData.pricing.strip.stripPrice)
          },
          box: formData.pricing.box.boxPrice ? {
            stripsPerBox: parseInt(formData.pricing.box.stripsPerBox),
            boxPrice: parseFloat(formData.pricing.box.boxPrice)
          } : undefined
        },
        stock: {
          boxes: parseInt(formData.stock.boxes) || 0,
          strips: parseInt(formData.stock.strips) || 0,
          looseTablets: parseInt(formData.stock.looseTablets) || 0
        },
        suppliers: selectedVendors.map((vendorId, index) => {
          const vendor = vendors.find(v => v._id === vendorId);
          return {
            vendor: vendorId,
            vendorName: vendor?.name || '',
            supplierPrice: 0,
            isPreferred: index === 0
          };
        })
      };

      if (medicine) {
        await ownerService.updateMedicine(medicine._id, dataToSend);
      } else {
        await ownerService.createMedicine(dataToSend);
      }
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };





  const toggleVendor = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  // return (
  //   <div className="tablets-premium-modal-overlay">
  //     <div className="tablets-premium-modal tablets-premium-modal-wide">
  //       <div className="tablets-premium-modal-content">
  //         <div className="tablets-premium-modal-header">
  //           <h2 className="tablets-premium-modal-title">
  //             {medicine ? 'Edit Medicine' : 'Add New Medicine'}
  //           </h2>
  //           <button onClick={onClose} className="tablets-premium-modal-close">
  //             <X className="tablets-premium-icon" />
  //           </button>
  //         </div>

  //         {error && (
  //           <div className="tablets-premium-alert tablets-premium-alert-error">
  //             {error}
  //           </div>
  //         )}

  //         <form onSubmit={handleSubmit} className="tablets-premium-form">
  //           {/* Basic Information */}
  //           <div className="tablets-premium-form-section">
  //             <h3 className="tablets-premium-form-section-title">
  //               <Package className="w-4 h-4" />
  //               Basic Information
  //             </h3>
  //             <div className="tablets-premium-form-grid">
  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Name *</label>
  //                 <input
  //                   type="text"
  //                   required
  //                   value={formData.name}
  //                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="Paracetamol"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Brand *</label>
  //                 <input
  //                   type="text"
  //                   required
  //                   value={formData.brand}
  //                   onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="Crocin"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Company *</label>
  //                 <input
  //                   type="text"
  //                   required
  //                   value={formData.company}
  //                   onChange={(e) => setFormData({ ...formData, company: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="GSK Pharmaceuticals"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Strength *</label>
  //                 <input
  //                   type="text"
  //                   required
  //                   value={formData.strength}
  //                   onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="500mg"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Category *</label>
  //                 <select
  //                   value={formData.category}
  //                   onChange={(e) => setFormData({ ...formData, category: e.target.value })}
  //                   className="tablets-premium-select"
  //                 >
  //                   <option value="General">General</option>
  //                   <option value="Pain Relief">Pain Relief</option>
  //                   <option value="Antibiotic">Antibiotic</option>
  //                   <option value="Vitamin">Vitamin</option>
  //                   <option value="Diabetes">Diabetes</option>
  //                   <option value="Cardio">Cardio</option>
  //                 </select>
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Dosage Form</label>
  //                 <select
  //                   value={formData.dosageForm}
  //                   onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
  //                   className="tablets-premium-select"
  //                 >
  //                   <option value="Tablet">Tablet</option>
  //                   <option value="Capsule">Capsule</option>
  //                   <option value="Syrup">Syrup</option>
  //                   <option value="Injection">Injection</option>
  //                   <option value="Cream">Cream</option>
  //                   <option value="Drops">Drops</option>
  //                 </select>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Packaging Information */}
  //           <div className="tablets-premium-form-section">
  //             <h3 className="tablets-premium-form-section-title">
  //               <Box className="w-4 h-4" />
  //               Packaging & Pricing
  //             </h3>
  //             <div className="tablets-premium-form-grid">
  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Pack Type *</label>
  //                 <select
  //                   value={formData.packaging.packType}
  //                   onChange={(e) => setFormData({
  //                     ...formData,
  //                     packaging: { ...formData.packaging, packType: e.target.value }
  //                   })}
  //                   className="tablets-premium-select"
  //                 >
  //                   <option value="Strip">Strip</option>
  //                   <option value="Blister">Blister</option>
  //                   <option value="Bottle">Bottle</option>
  //                   <option value="Box">Box</option>
  //                   <option value="Vial">Vial</option>
  //                   <option value="Tube">Tube</option>
  //                   <option value="Sachet">Sachet</option>
  //                   <option value="Ampoule">Ampoule</option>
  //                 </select>
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Units Per Pack *</label>
  //                 <input
  //                   type="number"
  //                   required
  //                   min="1"
  //                   value={formData.packaging.unitsPerPack}
  //                   onChange={(e) => handlePackPriceChange(
  //                     formData.packaging.packPrice,
  //                     parseInt(e.target.value) || 1
  //                   )}
  //                   className="tablets-premium-input"
  //                   placeholder="10"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Unit Type *</label>
  //                 <select
  //                   value={formData.packaging.unitType}
  //                   onChange={(e) => setFormData({
  //                     ...formData,
  //                     packaging: { ...formData.packaging, unitType: e.target.value }
  //                   })}
  //                   className="tablets-premium-select"
  //                 >
  //                   <option value="Tablet">Tablet</option>
  //                   <option value="Capsule">Capsule</option>
  //                   <option value="ml">ml</option>
  //                   <option value="gm">gm</option>
  //                   <option value="Piece">Piece</option>
  //                 </select>
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Pack Price (₹) *</label>
  //                 <input
  //                   type="number"
  //                   required
  //                   min="0"
  //                   step="0.01"
  //                   value={formData.packaging.packPrice}
  //                   onChange={(e) => handlePackPriceChange(
  //                     parseFloat(e.target.value) || 0,
  //                     formData.packaging.unitsPerPack
  //                   )}
  //                   className="tablets-premium-input"
  //                   placeholder="80.00"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Unit Price (₹) *</label>
  //                 <input
  //                   type="number"
  //                   required
  //                   min="0"
  //                   step="0.01"
  //                   value={formData.packaging.unitPrice}
  //                   onChange={(e) => setFormData({
  //                     ...formData,
  //                     packaging: { ...formData.packaging, unitPrice: e.target.value }
  //                   })}
  //                   className="tablets-premium-input"
  //                   placeholder="8.00"
  //                   readOnly
  //                 />
  //                 <p className="tablets-premium-help-text">
  //                   Auto-calculated from pack price
  //                 </p>
  //               </div>
  //             </div>
  //           </div>

  //           {/* Stock Management */}
  //           <div className="tablets-premium-form-section">
  //             <h3 className="tablets-premium-form-section-title">
  //               <Package className="w-4 h-4" />
  //               Stock Management
  //             </h3>
  //             <div className="tablets-premium-form-grid">
  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Stock (in Packs) *</label>
  //                 <input
  //                   type="number"
  //                   required
  //                   min="0"
  //                   value={formData.stock}
  //                   onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="50"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Loose Units</label>
  //                 <input
  //                   type="number"
  //                   min="0"
  //                   value={formData.looseUnits}
  //                   onChange={(e) => setFormData({ ...formData, looseUnits: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="0"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Min Stock Level</label>
  //                 <input
  //                   type="number"
  //                   min="0"
  //                   value={formData.minStockLevel}
  //                   onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="10"
  //                 />
  //               </div>

  //               <div className="tablets-premium-form-group">
  //                 <label className="tablets-premium-label">Max Stock Level</label>
  //                 <input
  //                   type="number"
  //                   min="0"
  //                   value={formData.maxStockLevel}
  //                   onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
  //                   className="tablets-premium-input"
  //                   placeholder="500"
  //                 />
  //               </div>

  //               {/* Stock Summary */}
  //               {formData.stock && formData.packaging.unitsPerPack && (
  //                 <div className="tablets-premium-form-group tablets-premium-form-group-full">
  //                   <div className="tablets-premium-stock-summary">
  //                     <strong>Total Units Available:</strong>
  //                     <span className="tablets-premium-stock-total-value">
  //                       {(parseInt(formData.stock) * parseInt(formData.packaging.unitsPerPack)) + parseInt(formData.looseUnits || 0)} units
  //                     </span>
  //                     <span className="tablets-premium-stock-breakdown">
  //                       ({formData.stock} packs × {formData.packaging.unitsPerPack} + {formData.looseUnits || 0} loose)
  //                     </span>
  //                   </div>
  //                 </div>
  //               )}
  //             </div>
  //           </div>

  //           {/* Vendor Selection */}
  //           <div className="tablets-premium-form-section">
  //             <h3 className="tablets-premium-form-section-title">
  //               <Building2 className="w-4 h-4" />
  //               Suppliers / Vendors (Optional)
  //             </h3>
  //             <div className="tablets-premium-vendor-selection">
  //               {vendors.length === 0 ? (
  //                 <div className="tablets-premium-no-vendors">
  //                   <AlertTriangle className="w-5 h-5" />
  //                   <p>No vendors available. You can add vendors later.</p>
  //                 </div>
  //               ) : (
  //                 <div className="tablets-premium-vendor-grid">
  //                   {vendors.map((vendor) => (
  //                     <label
  //                       key={vendor._id}
  //                       className={`tablets-premium-vendor-card ${
  //                         selectedVendors.includes(vendor._id) ? 'selected' : ''
  //                       }`}
  //                     >
  //                       <input
  //                         type="checkbox"
  //                         checked={selectedVendors.includes(vendor._id)}
  //                         onChange={() => toggleVendor(vendor._id)}
  //                         className="tablets-premium-vendor-checkbox"
  //                       />
  //                       <div className="tablets-premium-vendor-info">
  //                         <div className="tablets-premium-vendor-name">
  //                           {vendor.name}
  //                           {selectedVendors.indexOf(vendor._id) === 0 && selectedVendors.includes(vendor._id) && (
  //                             <span className="tablets-premium-vendor-badge">Preferred</span>
  //                           )}
  //                         </div>
  //                         <div className="tablets-premium-vendor-company">{vendor.company}</div>
  //                         <div className="tablets-premium-vendor-contact">
  //                           {vendor.phone} • {vendor.email}
  //                         </div>
  //                       </div>
  //                     </label>
  //                   ))}
  //                 </div>
  //               )}
  //             </div>
  //           </div>

  //           {/* Description */}
  //           <div className="tablets-premium-form-section">
  //             <div className="tablets-premium-form-group tablets-premium-form-group-full">
  //               <label className="tablets-premium-label">Description</label>
  //               <textarea
  //                 value={formData.description}
  //                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  //                 rows="3"
  //                 className="tablets-premium-textarea"
  //                 placeholder="Additional information about the medicine..."
  //               />
  //             </div>
  //           </div>

  //           {/* Form Actions */}
  //           <div className="tablets-premium-form-actions">
  //             <button
  //               type="button"
  //               onClick={onClose}
  //               className="tablets-premium-btn tablets-premium-btn-secondary tablets-premium-btn-full"
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="submit"
  //               disabled={loading}
  //               className="tablets-premium-btn tablets-premium-btn-primary tablets-premium-btn-full"
  //             >
  //               {loading ? (
  //                 <>
  //                   <div className="tablets-premium-spinner-small"></div>
  //                   <span>Saving...</span>
  //                 </>
  //               ) : (
  //                 <>
  //                   <CheckCircle className="w-4 h-4" />
  //                   <span>{medicine ? 'Update Medicine' : 'Add Medicine'}</span>
  //                 </>
  //               )}
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
  <div className="modal-overlay">
    <div className="modal">
      <h2 className="modal-title">{medicine ? "Edit Medicine" : "Add New Medicine"}</h2>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="form-grid">

        {/* Basic Info */}
        <div className="form-section">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />

          <label>Brand</label>
          <input
            type="text"
            value={formData.brand}
            onChange={e => setFormData({ ...formData, brand: e.target.value })}
          />

          <label>Company</label>
          <input
            type="text"
            value={formData.company}
            onChange={e => setFormData({ ...formData, company: e.target.value })}
          />

          <label>Strength</label>
          <input
            type="text"
            value={formData.strength}
            onChange={e => setFormData({ ...formData, strength: e.target.value })}
          />

          <label>Category</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="General">General</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Painkiller">Painkiller</option>
            <option value="Vitamin">Vitamin</option>
          </select>

          <label>Dosage Form</label>
          <select
            value={formData.dosageForm}
            onChange={e => setFormData({ ...formData, dosageForm: e.target.value })}
          >
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
          </select>
        </div>

        {/* Pricing Section */}
        <div className="form-section">
          <h3>Pricing</h3>

          <label>Per Tablet Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.pricing.perTablet}
            onChange={e =>
              setFormData({
                ...formData,
                pricing: { ...formData.pricing, perTablet: e.target.value }
              })
            }
          />

          <h4>Strip Pricing</h4>
          <label>Tablets Per Strip</label>
          <input
            type="number"
            value={formData.pricing.strip.tabletsPerStrip}
            onChange={e =>
              setFormData({
                ...formData,
                pricing: {
                  ...formData.pricing,
                  strip: {
                    ...formData.pricing.strip,
                    tabletsPerStrip: e.target.value
                  }
                }
              })
            }
          />

          <label>Strip Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.pricing.strip.stripPrice}
            onChange={e =>
              setFormData({
                ...formData,
                pricing: {
                  ...formData.pricing,
                  strip: {
                    ...formData.pricing.strip,
                    stripPrice: e.target.value
                  }
                }
              })
            }
          />

          {stripSavings && (
            <div className="savings-info">
              <p>Individual Cost: ₹{stripSavings.individualCost}</p>
              <p>You Save: ₹{stripSavings.savings} ({stripSavings.percent}%)</p>
            </div>
          )}

          <h4>Box Pricing</h4>
          <label>Strips Per Box</label>
          <input
            type="number"
            value={formData.pricing.box.stripsPerBox}
            onChange={e =>
              setFormData({
                ...formData,
                pricing: {
                  ...formData.pricing,
                  box: {
                    ...formData.pricing.box,
                    stripsPerBox: e.target.value
                  }
                }
              })
            }
          />

          <label>Box Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.pricing.box.boxPrice}
            onChange={e =>
              setFormData({
                ...formData,
                pricing: {
                  ...formData.pricing,
                  box: {
                    ...formData.pricing.box,
                    boxPrice: e.target.value
                  }
                }
              })
            }
          />

          {boxSavings && (
            <div className="savings-info">
              <p>Strips Cost: ₹{boxSavings.stripsCost}</p>
              <p>You Save: ₹{boxSavings.savings} ({boxSavings.percent}%)</p>
            </div>
          )}
        </div>

        {/* Stock Section */}
        <div className="form-section">
          <h3>Stock</h3>

          <label>Boxes</label>
          <input
            type="number"
            value={formData.stock.boxes}
            onChange={e =>
              setFormData({
                ...formData,
                stock: { ...formData.stock, boxes: e.target.value }
              })
            }
          />

          <label>Strips</label>
          <input
            type="number"
            value={formData.stock.strips}
            onChange={e =>
              setFormData({
                ...formData,
                stock: { ...formData.stock, strips: e.target.value }
              })
            }
          />

          <label>Loose Tablets</label>
          <input
            type="number"
            value={formData.stock.looseTablets}
            onChange={e =>
              setFormData({
                ...formData,
                stock: { ...formData.stock, looseTablets: e.target.value }
              })
            }
          />

          <p className="total-tablets">Total Tablets: {totalTablets}</p>
        </div>

        {/* Vendors Section */}
        <div className="form-section">
          <h3>Suppliers</h3>
          <select
            multiple
            value={selectedVendors}
            onChange={e =>
              setSelectedVendors(
                [...e.target.selectedOptions].map(o => o.value)
              )
            }
          >
            {vendors.map(v => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="form-section full-width">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        {/* Buttons */}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  </div>
);


};

export default ManageTablets;