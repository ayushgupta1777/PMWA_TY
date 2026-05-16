// backend/src/controllers/ownerController.js
const Worker = require('../models/Worker');
const Tablet = require('../models/Tablet');
const Bill = require('../models/Bill');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

const Vendor = require('../models/Vendor');
const requireOwner = require('../middleware/authMiddleware').requireOwner;
const StockRequest = require('../models/StockRequest');

// Helper function to get date range
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  return { startDate, endDate: new Date() };
};

// ===== DASHBOARD CONTROLLERS =====

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get previous period for comparison
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate - periodLength);
    const prevEndDate = startDate;

    // Current period stats
    const [
      currentBills,
      prevBills,
      activeWorkers,
      totalMedicines,
      lowStockCount
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lt: prevEndDate }, status: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Worker.countDocuments({ isActive: true }),
      Tablet.countDocuments({ isActive: true }),
      Tablet.countDocuments({ stock: { $lte: 10 }, isActive: true })
    ]);

    const currentStats = currentBills[0] || { totalRevenue: 0, count: 0 };
    const prevStats = prevBills[0] || { totalRevenue: 0, count: 0 };

    // Calculate changes
    const revenueChange = prevStats.totalRevenue > 0 
      ? ((currentStats.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue * 100).toFixed(1)
      : 0;
    
    const billsChange = prevStats.count > 0
      ? ((currentStats.count - prevStats.count) / prevStats.count * 100).toFixed(1)
      : 0;

    const avgOrderValue = currentStats.count > 0 
      ? (currentStats.totalRevenue / currentStats.count).toFixed(2)
      : 0;

    const prevAvgOrderValue = prevStats.count > 0
      ? (prevStats.totalRevenue / prevStats.count).toFixed(2)
      : 0;

    const aovChange = prevAvgOrderValue > 0
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      totalRevenue: currentStats.totalRevenue,
      revenueChange: parseFloat(revenueChange),
      totalBills: currentStats.count,
      billsChange: parseFloat(billsChange),
      activeWorkers,
      workersChange: 0, // Can be calculated if needed
      avgOrderValue: parseFloat(avgOrderValue),
      aovChange: parseFloat(aovChange),
      totalMedicines,
      lowStockCount
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// ===== WORKER PERFORMANCE CONTROLLERS =====

// Get Worker Performance
exports.getWorkerPerformance = async (req, res) => {
  try {
    const { period = 'today', limit = 10 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const performance = await Bill.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'Completed' } },
      {
        $group: {
          _id: '$worker',
          totalSales: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'workerInfo'
        }
      },
      { $unwind: '$workerInfo' },
      {
        $project: {
          _id: 1,
          name: '$workerInfo.name',
          employeeId: '$workerInfo.employeeId',
          department: '$workerInfo.department',
          totalSales: 1,
          totalBills: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      }
    ]);

    res.json(performance);

  } catch (error) {
    console.error('Get worker performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch worker performance' });
  }
};

// Get Worker Details
// exports.getWorkerDetails = async (req, res) => {
//   try {
//     const { workerId } = req.params;
//     const { period = 'month' } = req.query;
//     const { startDate, endDate } = getDateRange(period);

//     const worker = await Worker.findById(workerId).select('-password');
//     if (!worker) {
//       return res.status(404).json({ success: false, message: 'Worker not found' });
//     }

//     // Get worker's sales stats
//     const stats = await Bill.aggregate([
//       { $match: { worker: mongoose.Types.ObjectId(workerId), createdAt: { $gte: startDate, $lte: endDate }, status: 'Completed' } },
//       {
//         $group: {
//           _id: null,
//           totalSales: { $sum: '$totalAmount' },
//           totalBills: { $sum: 1 },
//           avgOrderValue: { $avg: '$totalAmount' }
//         }
//       }
//     ]);

//     // Get top selling medicines by this worker
//     const topMedicines = await Bill.aggregate([
//       { $match: { worker: mongoose.Types.ObjectId(workerId), createdAt: { $gte: startDate, $lte: endDate }, status: 'Completed' } },
//       { $unwind: '$items' },
//       {
//         $group: {
//           _id: '$items.tablet',
//           name: { $first: '$items.name' },
//           totalQuantity: { $sum: '$items.quantity' },
//           totalRevenue: { $sum: '$items.totalPrice' }
//         }
//       },
//       { $sort: { totalQuantity: -1 } },
//       { $limit: 5 }
//     ]);

//     // Daily sales for the period
//     const dailySales = await Bill.aggregate([
//       { $match: { worker: mongoose.Types.ObjectId(workerId), createdAt: { $gte: startDate, $lte: endDate }, status: 'Completed' } },
//       {
//         $group: {
//           _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
//           sales: { $sum: '$totalAmount' },
//           bills: { $sum: 1 }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     res.json({
//       success: true,
//       worker,
//       stats: stats[0] || { totalSales: 0, totalBills: 0, avgOrderValue: 0 },
//       topMedicines,
//       dailySales
//     });

//   } catch (error) {
//     console.error('Get worker details error:', error);
//     res.status(500).json({ success: false, message: 'Failed to fetch worker details' });
//   }
// };

exports.getWorkerDetails = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { period = 'month' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ success: false, message: 'Invalid worker ID' });
    }

    const { startDate, endDate } = getDateRange(period);
    const worker = await Worker.findById(workerId).select('-password');
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    const matchQuery = { worker: new mongoose.Types.ObjectId(workerId), createdAt: { $gte: startDate, $lte: endDate }, status: 'Completed' };

    const [stats, topMedicines, dailySales] = await Promise.all([
      Bill.aggregate([{ $match: matchQuery }, { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, totalBills: { $sum: 1 }, avgOrderValue: { $avg: '$totalAmount' } } }]),
      Bill.aggregate([{ $match: matchQuery }, { $unwind: '$items' }, { $group: { _id: '$items.tablet', name: { $first: '$items.name' }, totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } }, { $sort: { totalQuantity: -1 } }, { $limit: 5 }]),
      Bill.aggregate([{ $match: matchQuery }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$totalAmount' }, bills: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    ]);

    res.json({
      success: true,
      worker,
      stats: stats[0] || { totalSales: 0, totalBills: 0, avgOrderValue: 0 },
      topMedicines,
      dailySales
    });

  } catch (error) {
    console.error('Get worker details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch worker details' });
  }
};


// Get Worker Sales History
exports.getWorkerSalesHistory = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { worker: workerId, status: 'Completed' };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.tablet', 'name brand company')
      .lean();

    const totalBills = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      totalPages: Math.ceil(totalBills / limit),
      currentPage: page,
      totalBills
    });

  } catch (error) {
    console.error('Get worker sales history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales history' });
  }
};

// ===== INVENTORY CONTROLLERS =====

// Get Stock Alerts
exports.getStockAlerts = async (req, res) => {
  try {
    // Get medicines with stock issues
    const medicines = await Tablet.find({ isActive: true }).lean();

    // Analyze each medicine for alerts
    const alerts = [];
    
    for (const medicine of medicines) {
      // Check if out of stock
      if (medicine.stock === 0) {
        alerts.push({
          ...medicine,
          type: 'out_of_stock',
          severity: 'critical',
          message: 'Out of stock'
        });
        continue;
      }

      // Check if low stock
      if (medicine.stock <= medicine.minStockLevel) {
        alerts.push({
          ...medicine,
          type: 'low_stock',
          severity: 'high',
          message: `Only ${medicine.stock} units left`
        });
      }

      // Check for demand spike (comparing last 7 days vs previous 7 days)
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const prev7Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const [recentSales, previousSales] = await Promise.all([
        Bill.aggregate([
          { $match: { createdAt: { $gte: last7Days }, status: 'Completed' } },
          { $unwind: '$items' },
          { $match: { 'items.tablet': medicine._id } },
          { $group: { _id: null, total: { $sum: '$items.quantity' } } }
        ]),
        Bill.aggregate([
          { $match: { createdAt: { $gte: prev7Days, $lt: last7Days }, status: 'Completed' } },
          { $unwind: '$items' },
          { $match: { 'items.tablet': medicine._id } },
          { $group: { _id: null, total: { $sum: '$items.quantity' } } }
        ])
      ]);

      const recentTotal = recentSales[0]?.total || 0;
      const previousTotal = previousSales[0]?.total || 0;

      // If recent sales are 50% higher than previous period, it's a demand spike
      if (previousTotal > 0 && recentTotal > previousTotal * 1.5) {
        alerts.push({
          ...medicine,
          type: 'high_demand',
          severity: 'medium',
          message: 'Sudden increase in demand detected',
          demandSpike: true,
          recentSales: recentTotal,
          previousSales: previousTotal
        });
      } else if (recentTotal > 0) {
        // Mark as steady demand
        medicine.steadyDemand = true;
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json(alerts);

  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock alerts' });
  }
};

// Get Inventory Overview
exports.getInventoryOverview = async (req, res) => {
  try {
    const [
      totalMedicines,
      outOfStock,
      lowStock,
      totalValue,
      categoryBreakdown
    ] = await Promise.all([
      Tablet.countDocuments({ isActive: true }),
      Tablet.countDocuments({ stock: 0, isActive: true }),
      Tablet.countDocuments({ $expr: { $lte: ['$stock', '$minStockLevel'] }, isActive: true }),
      Tablet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$price'] } } } }
      ]),
      Tablet.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      totalMedicines,
      outOfStock,
      lowStock,
      totalValue: totalValue[0]?.total || 0,
      categoryBreakdown
    });

  } catch (error) {
    console.error('Get inventory overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory overview' });
  }
};

// ===== SALES TRENDS CONTROLLERS =====

// Get Sales Trends
exports.getSalesTrends = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get previous period for comparison
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate - periodLength);

    // Get top selling medicines with growth rate
    const trends = await Bill.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lte: endDate }, status: 'Completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.tablet',
          name: { $first: '$items.name' },
          brand: { $first: '$items.brand' },
          category: { $first: 'General' },
          currentSales: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startDate] }, '$items.quantity', 0]
            }
          },
          previousSales: {
            $sum: {
              $cond: [{ $lt: ['$createdAt', startDate] }, '$items.quantity', 0]
            }
          },
          soldCount: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      {
        $addFields: {
          growth: {
            $cond: [
              { $eq: ['$previousSales', 0] },
              100,
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$currentSales', '$previousSales'] }, '$previousSales'] },
                  100
                ]
              }
            ]
          }
        }
      },
      { $sort: { soldCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          brand: 1,
          category: 1,
          soldCount: 1,
          revenue: 1,
          growth: { $round: ['$growth', 1] }
        }
      }
    ]);

    res.json(trends);

  } catch (error) {
    console.error('Get sales trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales trends' });
  }
};

// Get Critical Alerts
exports.getCriticalAlerts = async (req, res) => {
  try {
    const criticalAlerts = [];

    // Check for out of stock high-demand items
    const outOfStockHighDemand = await Tablet.find({
      stock: 0,
      popularity: { $gte: 50 },
      isActive: true
    }).limit(5);

    outOfStockHighDemand.forEach(item => {
      criticalAlerts.push({
        type: 'critical_stock',
        severity: 'critical',
        message: `${item.name} is out of stock (high demand item)`,
        medicineId: item._id,
        medicineName: item.name
      });
    });

    // Check for expiring medicines (within 30 days)
    const expiringMedicines = await Tablet.find({
      expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() },
      stock: { $gt: 0 },
      isActive: true
    }).limit(5);

    expiringMedicines.forEach(item => {
      criticalAlerts.push({
        type: 'expiry_alert',
        severity: 'high',
        message: `${item.name} expiring soon (${item.stock} units)`,
        medicineId: item._id,
        medicineName: item.name,
        expiryDate: item.expiryDate
      });
    });

    res.json(criticalAlerts);

  } catch (error) {
    console.error('Get critical alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch critical alerts' });
  }
};

// Additional controllers will be added in the next part...


// backend/src/controllers/ownerController.js - Part 2

// ===== MEDICINE MANAGEMENT CONTROLLERS =====

// Get all medicines with pagination and filters
exports.getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, stockStatus } = req.query;
    
    const query = { isActive: true };
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Stock status filter
    if (stockStatus === 'out_of_stock') {
      query.stock = 0;
      query.looseUnits = 0;
    } else if (stockStatus === 'low_stock') {
      query.$expr = { $lte: ['$stock', '$minStockLevel'] };
    } else if (stockStatus === 'in_stock') {
      query.stock = { $gt: 0 };
    }
    
    const skip = (page - 1) * limit;
    
    const medicines = await Tablet.find(query)
      .populate('suppliers.vendor', 'name company phone email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const totalCount = await Tablet.countDocuments(query);
    
    res.json({
      success: true,
      medicines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines'
    });
  }
};

// Create new medicine with packaging and vendors
// backend/src/controllers/ownerController.js - REPLACE createMedicine function

exports.createMedicine = async (req, res) => {
  try {
    const {
      name,
      brand,
      company,
      strength,
      category,
      description,
      pricing,  // ✅ NEW: 3-level pricing
      stock,    // ✅ NEW: boxes, strips, looseTablets
      suppliers,
      dosageForm,
      expiryDate,
      batchNumber
    } = req.body;

    // ✅ Validate pricing structure
    if (!pricing || !pricing.perTablet || !pricing.strip.tabletsPerStrip || !pricing.strip.stripPrice) {
      return res.status(400).json({
        success: false,
        message: 'Complete pricing information is required (perTablet, strip details)'
      });
    }

    // ✅ Validate suppliers
    if (suppliers && suppliers.length > 0) {
      const vendorIds = suppliers.map(s => s.vendor);
      const vendors = await Vendor.find({ _id: { $in: vendorIds } });
      
      if (vendors.length !== vendorIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more vendor IDs are invalid'
        });
      }

      // Ensure at least one supplier is preferred
      let hasPreferred = suppliers.some(s => s.isPreferred);
      if (!hasPreferred && suppliers.length > 0) {
        suppliers[0].isPreferred = true;
      }
    }

    const newMedicine = new Tablet({
      name,
      brand,
      company,
      strength,
      category,
      description,
      pricing,  // ✅ NEW structure
      stock: stock || { boxes: 0, strips: 0, looseTablets: 0 },
      suppliers: suppliers || [],
      dosageForm,
      expiryDate,
      batchNumber
    });

    await newMedicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      medicine: newMedicine
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      error: error.message
    });
  }
};

// REPLACE updateMedicine function
exports.updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const updateData = req.body;

    // ✅ If pricing updated, recalculate savings
    if (updateData.pricing) {
      if (updateData.pricing.strip) {
        const { perTablet, strip } = updateData.pricing;
        const individualCost = perTablet * strip.tabletsPerStrip;
        const stripSavings = ((individualCost - strip.stripPrice) / individualCost) * 100;
        updateData.pricing.strip.savingsPercent = Math.round(stripSavings * 10) / 10;
      }
      
      if (updateData.pricing.box?.boxPrice) {
        const { strip, box } = updateData.pricing;
        const stripsCost = strip.stripPrice * box.stripsPerBox;
        const boxSavings = ((stripsCost - box.boxPrice) / stripsCost) * 100;
        updateData.pricing.box.savingsPercent = Math.round(boxSavings * 10) / 10;
      }
    }

    // ✅ If suppliers updated, ensure one is preferred
    if (updateData.suppliers && updateData.suppliers.length > 0) {
      let hasPreferred = updateData.suppliers.some(s => s.isPreferred);
      if (!hasPreferred) {
        updateData.suppliers[0].isPreferred = true;
      }
    }

    // ✅ Record price change in history
    const medicine = await Tablet.findById(medicineId);
    if (medicine && updateData.pricing) {
      if (medicine.pricing?.perTablet !== updateData.pricing.perTablet) {
        if (!updateData.priceHistory) {
          updateData.priceHistory = medicine.priceHistory || [];
        }
        updateData.priceHistory.push({
          perTablet: updateData.pricing.perTablet,
          stripPrice: updateData.pricing.strip.stripPrice,
          date: new Date(),
          reason: 'Price updated by owner'
        });
      }
    }

    const updatedMedicine = await Tablet.findByIdAndUpdate(
      medicineId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('suppliers.vendor', 'name company phone email');

    if (!updatedMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      medicine: updatedMedicine
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message
    });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;

    // Soft delete (set isActive to false)
    const medicine = await Tablet.findByIdAndUpdate(
      medicineId,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine'
    });
  }
};

// Update stock (with packs and loose units)
exports.updateStock = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { stock, looseUnits, operation } = req.body;

    const medicine = await Tablet.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    if (operation === 'set') {
      medicine.stock = stock;
      if (looseUnits !== undefined) {
        medicine.looseUnits = looseUnits;
      }
    } else if (operation === 'add') {
      medicine.stock += stock;
      if (looseUnits) {
        medicine.looseUnits += looseUnits;
      }
    } else if (operation === 'subtract') {
      medicine.stock = Math.max(0, medicine.stock - stock);
      if (looseUnits) {
        medicine.looseUnits = Math.max(0, medicine.looseUnits - looseUnits);
      }
    }

    await medicine.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      medicine: {
        _id: medicine._id,
        name: medicine.name,
        stock: medicine.stock,
        looseUnits: medicine.looseUnits,
        totalUnitsAvailable: medicine.totalUnitsAvailable
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
};

// Bulk update stock
exports.bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const results = [];
    
    for (const update of updates) {
      try {
        const medicine = await Tablet.findById(update.medicineId);
        if (medicine) {
          medicine.stock = update.stock;
          if (update.looseUnits !== undefined) {
            medicine.looseUnits = update.looseUnits;
          }
          await medicine.save();
          results.push({
            medicineId: update.medicineId,
            success: true
          });
        }
      } catch (error) {
        results.push({
          medicineId: update.medicineId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk stock update completed',
      results
    });
  } catch (error) {
    console.error('Bulk update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update stock'
    });
  }
};

// Get inventory overview with packaging details
exports.getInventoryOverview = async (req, res) => {
  try {
    const totalMedicines = await Tablet.countDocuments({ isActive: true });
    
    const outOfStock = await Tablet.countDocuments({
      isActive: true,
      stock: 0,
      looseUnits: 0
    });
    
    const lowStock = await Tablet.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    });

    // Calculate total inventory value
    const medicines = await Tablet.find({ isActive: true }).lean();
    let totalValue = 0;
    
    for (const med of medicines) {
      const packValue = med.stock * (med.packaging?.packPrice || med.price || 0);
      const looseValue = (med.looseUnits || 0) * (med.packaging?.unitPrice || med.price || 0);
      totalValue += packValue + looseValue;
    }

    res.json({
      success: true,
      overview: {
        totalMedicines,
        outOfStock,
        lowStock,
        inStock: totalMedicines - outOfStock,
        totalInventoryValue: Math.round(totalValue),
        averageValue: totalMedicines > 0 ? Math.round(totalValue / totalMedicines) : 0
      }
    });
  } catch (error) {
    console.error('Inventory overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory overview'
    });
  }
};

// Get stock alerts
exports.getStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await Tablet.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$minStockLevel'] }
    })
      .populate('suppliers.vendor', 'name phone email')
      .sort({ stock: 1 })
      .limit(50)
      .lean();

    const outOfStockItems = await Tablet.find({
      isActive: true,
      stock: 0,
      looseUnits: 0
    })
      .populate('suppliers.vendor', 'name phone email')
      .sort({ name: 1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      alerts: {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        totalAlerts: lowStockItems.length + outOfStockItems.length
      }
    });
  } catch (error) {
    console.error('Stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock alerts'
    });
  }
};


// ===== WORKER MANAGEMENT CONTROLLERS =====

// Get All Workers
exports.getAllWorkers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, isActive } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const workers = await Worker.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalWorkers = await Worker.countDocuments(query);

    res.json({
      success: true,
      workers,
      totalPages: Math.ceil(totalWorkers / limit),
      currentPage: parseInt(page),
      totalWorkers
    });

  } catch (error) {
    console.error('Get all workers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workers' });
  }
};

// Create Worker
exports.createWorker = async (req, res) => {
  try {
    const { name, email, password, phone, employeeId, department } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if worker already exists
    const existingWorker = await Worker.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingWorker) {
      return res.status(400).json({
        success: false,
        message: existingWorker.email === email 
          ? 'Email already registered'
          : 'Employee ID already exists'
      });
    }

    // Create new worker
    const worker = new Worker({
      name,
      email,
      password,
      phone,
      employeeId: employeeId.toUpperCase(),
      department: department || 'Sales'
    });

    await worker.save();

    // Remove password from response
    const workerResponse = worker.toObject();
    delete workerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Worker created successfully',
      worker: workerResponse
    });

  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to create worker' });
  }
};

// Update Worker
exports.updateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates._id;
    delete updates.password; // Password updates should have separate endpoint
    delete updates.role;
    delete updates.createdAt;
    delete updates.updatedAt;

    const worker = await Worker.findByIdAndUpdate(
      workerId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.json({
      success: true,
      message: 'Worker updated successfully',
      worker
    });

  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to update worker' });
  }
};

// Delete Worker
exports.deleteWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    // Soft delete - mark as inactive
    const worker = await Worker.findByIdAndUpdate(
      workerId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.json({
      success: true,
      message: 'Worker deactivated successfully',
      worker
    });

  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete worker' });
  }
};

// Toggle Worker Status
exports.toggleWorkerStatus = async (req, res) => {
  try {
    const { workerId } = req.params;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    worker.isActive = !worker.isActive;
    await worker.save();

    const workerResponse = worker.toObject();
    delete workerResponse.password;

    res.json({
      success: true,
      message: `Worker ${worker.isActive ? 'activated' : 'deactivated'} successfully`,
      worker: workerResponse
    });

  } catch (error) {
    console.error('Toggle worker status error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle worker status' });
  }
};

// ===== ANALYTICS CONTROLLERS =====

// Get Revenue Analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Daily revenue breakdown
    const dailyRevenue = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bills: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Payment method breakdown
    const paymentMethodBreakdown = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top workers by revenue
    const topWorkers = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: '$worker',
          revenue: { $sum: '$totalAmount' },
          bills: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      { $unwind: '$worker' },
      {
        $project: {
          name: '$worker.name',
          employeeId: '$worker.employeeId',
          revenue: 1,
          bills: 1
        }
      }
    ]);

    // Total stats
    const totalStats = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      dailyRevenue,
      paymentMethodBreakdown,
      topWorkers,
      totalStats: totalStats[0] || { totalRevenue: 0, totalBills: 0, avgOrderValue: 0 }
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics' });
  }
};

// Get Top Selling Medicines
exports.getTopSellingMedicines = async (req, res) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const topMedicines = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'Completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.tablet',
          name: { $first: '$items.name' },
          brand: { $first: '$items.brand' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          avgPrice: { $avg: '$items.unitPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'tablets',
          localField: '_id',
          foreignField: '_id',
          as: 'medicineInfo'
        }
      },
      { $unwind: { path: '$medicineInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          brand: 1,
          company: '$medicineInfo.company',
          category: '$medicineInfo.category',
          currentStock: '$medicineInfo.stock',
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      }
    ]);

    res.json(topMedicines);

  } catch (error) {
    console.error('Get top selling medicines error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top selling medicines' });
  }
};

// Get Demand Patterns
exports.getDemandPatterns = async (req, res) => {
  try {
    const { medicineId } = req.params;

    // Get sales data for the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const dailySales = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: ninetyDaysAgo },
          status: 'Completed'
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.tablet': mongoose.Types.ObjectId(medicineId)
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate statistics
    const quantities = dailySales.map(d => d.quantity);
    const avgDailySales = quantities.length > 0
      ? quantities.reduce((a, b) => a + b, 0) / quantities.length
      : 0;

    const maxDailySales = quantities.length > 0 ? Math.max(...quantities) : 0;
    const minDailySales = quantities.length > 0 ? Math.min(...quantities) : 0;

    // Detect patterns
    const recentSales = quantities.slice(-7).reduce((a, b) => a + b, 0);
    const previousSales = quantities.slice(-14, -7).reduce((a, b) => a + b, 0);
    
    const trend = previousSales > 0
      ? ((recentSales - previousSales) / previousSales * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      dailySales,
      statistics: {
        avgDailySales: avgDailySales.toFixed(2),
        maxDailySales,
        minDailySales,
        trend: parseFloat(trend),
        trendDirection: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
      }
    });

  } catch (error) {
    console.error('Get demand patterns error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch demand patterns' });
  }
};

// ===== NOTIFICATIONS & SETTINGS =====

// Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    // For now, return mock data
    // In production, you'd have a Notification model
    res.json([
      {
        _id: '1',
        type: 'stock_alert',
        message: 'Paracetamol is running low on stock',
        read: false,
        createdAt: new Date()
      }
    ]);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Mark Notification as Read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    // Implementation would update notification status
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// Mark All Notifications as Read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    // Implementation would update all notifications
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};

// Get Settings
exports.getSettings = async (req, res) => {
  try {
    // Return default settings
    res.json({
      success: true,
      settings: {
        lowStockThreshold: 10,
        criticalStockThreshold: 5,
        autoReorderEnabled: false,
        emailNotifications: true,
        smsNotifications: false
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// Update Settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    // Implementation would save settings
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

// Get Dashboard Config
exports.getDashboardConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        defaultPeriod: 'today',
        showWorkerPerformance: true,
        showStockAlerts: true,
        showSalesTrends: true
      }
    });
  } catch (error) {
    console.error('Get dashboard config error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard config' });
  }
};

// Update Dashboard Config
exports.updateDashboardConfig = async (req, res) => {
  try {
    const config = req.body;
    res.json({
      success: true,
      message: 'Dashboard config updated successfully',
      config
    });
  } catch (error) {
    console.error('Update dashboard config error:', error);
    res.status(500).json({ success: false, message: 'Failed to update dashboard config' });
  }
};

// Generate Reports (placeholder - would use PDF generation library)
exports.generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Implementation would generate PDF report
    res.json({
      success: true,
      message: 'Report generation initiated',
      downloadUrl: '/reports/sales-report.pdf'
    });
  } catch (error) {
    console.error('Generate sales report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate sales report' });
  }
};

exports.generateInventoryReport = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Report generation initiated',
      downloadUrl: '/reports/inventory-report.pdf'
    });
  } catch (error) {
    console.error('Generate inventory report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate inventory report' });
  }
};

exports.generateWorkerReport = async (req, res) => {
  try {
    const { workerId } = req.params;
    res.json({
      success: true,
      message: 'Report generation initiated',
      downloadUrl: `/reports/worker-${workerId}-report.pdf`
    });
  } catch (error) {
    console.error('Generate worker report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate worker report' });
  }
};
// ===== STOCK REQUEST CONTROLLERS =====

// Add these functions to your existing ownerController.js file

// ===== STOCK REQUEST CONTROLLERS (UPDATED & NEW) =====

// Get Stock Requests with Vendor Filter
// exports.getStockRequests = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 15, 
//       status, 
//       urgency, 
//       search,
//       vendor 
//     } = req.query;

//     // Build query
//     const query = {};

//     // Filter by status
//     if (status) {
//       query.status = status;
//     }

//     // Filter by urgency
//     if (urgency) {
//       query.urgencyLevel = urgency;
//     }

//     // Search by request number
//     if (search) {
//       query.requestNumber = { $regex: search, $options: 'i' };
//     }

//     // Filter by preferred vendor (NEW)
//     if (vendor) {
//       query.preferredVendor = mongoose.Types.ObjectId(vendor);
//     }

//     // Fetch requests with populated fields
//     const requests = await StockRequest.find(query)
//       .populate('tablet', 'name brand company strength price')
//       .populate('requestedBy', 'name employeeId department')
//       .populate('reviewedBy', 'name')
//       .populate('preferredVendor', 'name company phone email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     // Get total count for pagination
//     const totalRequests = await StockRequest.countDocuments(query);

//     res.json({
//       success: true,
//       requests,
//       totalPages: Math.ceil(totalRequests / limit),
//       currentPage: parseInt(page),
//       totalRequests
//     });

//   } catch (error) {
//     console.error('Get stock requests error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock requests',
//       error: error.message 
//     });
//   }
// };

// exports.getStockRequests = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 15, 
//       status, 
//       urgency, 
//       search,
//       vendor 
//     } = req.query;

//     console.log('Fetching stock requests with filters:', { status, urgency, search, vendor });

//     const query = {};

//     if (status) query.status = status;
//     if (urgency) query.urgencyLevel = urgency;
//     if (search) query.requestNumber = { $regex: search, $options: 'i' };
    
//     // Filter by vendor - FIXED
//     if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
//       query['orderDetails.vendor'] = mongoose.Types.ObjectId(vendor);
//     }

//     const requests = await StockRequest.find(query)
//       .populate('tablet', 'name brand company strength price category stock')
//       .populate('requestedBy', 'name employeeId department email')
//       .populate('reviewedBy', 'name')
//       .populate('orderDetails.vendor', 'name company phone email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     const totalRequests = await StockRequest.countDocuments(query);

//     console.log('Found requests:', requests.length);

//     res.json({
//       success: true,
//       requests,
//       totalPages: Math.ceil(totalRequests / limit),
//       currentPage: parseInt(page),
//       totalRequests
//     });

//   } catch (error) {
//     console.error('Get stock requests error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock requests',
//       error: error.message 
//     });
//   }
// };

// Get Stock Request Stats with Unique Vendors Count (UPDATED)
// exports.getStockRequestStats = async (req, res) => {
//   try {
//     // Get counts for each status
//     const [
//       pending,
//       approved,
//       rejected,
//       critical,
//       uniqueVendors
//     ] = await Promise.all([
//       StockRequest.countDocuments({ status: 'Pending' }),
//       StockRequest.countDocuments({ status: 'Approved' }),
//       StockRequest.countDocuments({ status: 'Rejected' }),
//       StockRequest.countDocuments({ 
//         urgencyLevel: 'Critical', 
//         status: { $in: ['Pending', 'Under Review'] } 
//       }),
//       // Count unique vendors with approved requests not yet sent (NEW)
//       StockRequest.aggregate([
//         { 
//           $match: { 
//             status: 'Approved',
//             preferredVendor: { $exists: true, $ne: null }
//           } 
//         },
//         {
//           $group: {
//             _id: '$preferredVendor'
//           }
//         },
//         {
//           $count: 'uniqueCount'
//         }
//       ])
//     ]);

//     const uniqueVendorCount = uniqueVendors[0]?.uniqueCount || 0;

//     // Additional stats
//     const [
//       underReview,
//       ordered,
//       received
//     ] = await Promise.all([
//       StockRequest.countDocuments({ status: 'Under Review' }),
//       StockRequest.countDocuments({ status: 'Ordered' }),
//       StockRequest.countDocuments({ status: 'Received' })
//     ]);

//     // Get total estimated cost of pending requests
//     const pendingCostResult = await StockRequest.aggregate([
//       { 
//         $match: { 
//           status: { $in: ['Pending', 'Under Review'] },
//           estimatedCost: { $exists: true }
//         } 
//       },
//       { 
//         $group: { 
//           _id: null, 
//           totalEstimatedCost: { $sum: '$estimatedCost' } 
//         } 
//       }
//     ]);

//     const totalEstimatedCost = pendingCostResult[0]?.totalEstimatedCost || 0;

//     res.json({
//       success: true,
//       pending,
//       approved,
//       rejected,
//       critical,
//       underReview,
//       ordered,
//       received,
//       uniqueVendors: uniqueVendorCount,
//       totalEstimatedCost: Math.round(totalEstimatedCost)
//     });

//   } catch (error) {
//     console.error('Get stock request stats error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock request stats',
//       error: error.message 
//     });
//   }
// };

// Get Vendors with Request Counts (NEW)
// exports.getVendorsWithRequestCounts = async (req, res) => {
//   try {
//     console.log('Getting vendors with request counts...');
    
//     // Get all active vendors
//     const vendors = await Vendor.find({ isActive: true }).lean();
    
//     console.log('Total vendors found:', vendors.length);

//     // For each vendor, count approved requests not yet sent
//     const vendorsWithCounts = await Promise.all(
//       vendors.map(async (vendor) => {
//         try {
//           const approvedRequestCount = await StockRequest.countDocuments({
//             preferredVendor: vendor._id,
//             status: 'Approved'
//           });

//           console.log(`Vendor ${vendor.name}: ${approvedRequestCount} approved requests`);

//           return {
//             _id: vendor._id,
//             name: vendor.name,
//             company: vendor.company,
//             email: vendor.email,
//             phone: vendor.phone,
//             contactPerson: vendor.contactPerson,
//             approvedRequestCount: approvedRequestCount,
//             isActive: vendor.isActive
//           };
//         } catch (error) {
//           console.error(`Error counting for vendor ${vendor._id}:`, error);
//           return {
//             ...vendor,
//             approvedRequestCount: 0
//           };
//         }
//       })
//     );

//     // Sort by approved request count descending
//     vendorsWithCounts.sort((a, b) => b.approvedRequestCount - a.approvedRequestCount);

//     console.log('Vendors with counts:', vendorsWithCounts);

//     res.json({
//       success: true,
//       vendors: vendorsWithCounts
//     });

//   } catch (error) {
//     console.error('Get vendors with request counts error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch vendors',
//       error: error.message 
//     });
//   }
// };

// exports.getVendorsWithRequestCounts = async (req, res) => {
//   try {
//     console.log('Getting vendors with request counts...');
    
//     // Get all active vendors
//     const vendors = await Vendor.find({ isActive: true }).lean();
//     console.log('Total vendors found:', vendors.length);

//     // Get counts using aggregation for better performance
//     const requestCounts = await StockRequest.aggregate([
//       {
//         $match: {
//           status: 'Approved',
//           'orderDetails.vendor': { $exists: true, $ne: null }
//         }
//       },
//       {
//         $group: {
//           _id: '$orderDetails.vendor',
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Create a map of vendor IDs to counts
//     const countMap = {};
//     requestCounts.forEach(item => {
//       countMap[item._id.toString()] = item.count;
//     });

//     // Combine vendors with their counts
//     const vendorsWithCounts = vendors.map(vendor => ({
//       _id: vendor._id,
//       name: vendor.name,
//       company: vendor.company,
//       email: vendor.email,
//       phone: vendor.phone,
//       contactPerson: vendor.contactPerson,
//       approvedRequestCount: countMap[vendor._id.toString()] || 0,
//       isActive: vendor.isActive
//     }));

//     // Sort by approved request count
//     vendorsWithCounts.sort((a, b) => b.approvedRequestCount - a.approvedRequestCount);

//     console.log('Vendors with counts:', vendorsWithCounts);

//     res.json({
//       success: true,
//       vendors: vendorsWithCounts
//     });

//   } catch (error) {
//     console.error('Get vendors with request counts error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch vendors',
//       error: error.message 
//     });
//   }
// };

// 6. FIXED ownerController.js - Get Vendors with Request Counts
// exports.getVendorsWithRequestCounts = async (req, res) => {
//   try {
//     const vendors = await Vendor.find({ isActive: true }).lean();

//     const vendorsWithCounts = await Promise.all(
//       vendors.map(async (vendor) => {
//         const orderedCount = await StockRequest.countDocuments({
//           'orderDetails.vendor': vendor._id,
//           status: 'Ordered'
//         });

//         return {
//           _id: vendor._id,
//           name: vendor.name,
//           company: vendor.company,
//           email: vendor.email,
//           phone: vendor.phone,
//           contactPerson: vendor.contactPerson,
//           approvedRequestCount: orderedCount,
//           isActive: vendor.isActive
//         };
//       })
//     );

//     vendorsWithCounts.sort((a, b) => b.approvedRequestCount - a.approvedRequestCount);

//     res.json({
//       success: true,
//       vendors: vendorsWithCounts
//     });

//   } catch (error) {
//     console.error('Get vendors error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch vendors',
//       error: error.message
//     });
//   }
// };


// Bulk Send to Vendor (NEW)
// exports.bulkSendToVendor = async (req, res) => {
//   try {
//     console.log('Bulk send request body:', req.body);

//     const { 
//       requestIds, 
//       vendorId, 
//       orderDate, 
//       expectedDeliveryDate, 
//       notes 
//     } = req.body;

//     // Validate input
//     if (!Array.isArray(requestIds) || requestIds.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No requests selected' 
//       });
//     }

//     if (!vendorId || !expectedDeliveryDate) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Vendor and delivery date are required' 
//       });
//     }

//     console.log(`Updating ${requestIds.length} requests...`);

//     // Convert to ObjectIds
//     const objectIds = requestIds.map(id => {
//       try {
//         return mongoose.Types.ObjectId(id);
//       } catch (e) {
//         console.error('Invalid ID:', id);
//         return null;
//       }
//     }).filter(id => id !== null);

//     if (objectIds.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid request IDs' 
//       });
//     }

//     // Verify all requests are approved
//     const requests = await StockRequest.find({
//       _id: { $in: objectIds },
//       status: 'Approved'
//     });

//     console.log(`Found ${requests.length} approved requests`);

//     if (requests.length !== objectIds.length) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Only ${requests.length} out of ${objectIds.length} requests are approved` 
//       });
//     }

//     // Calculate total cost
//     const totalCost = requests.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);

//     console.log('Total cost:', totalCost);

//     // Update all requests
//     const updateResult = await StockRequest.updateMany(
//       {
//         _id: { $in: objectIds },
//         status: 'Approved'
//       },
//       {
//         $set: {
//           status: 'Ordered',
//           'orderDetails.vendor': vendorId,
//           'orderDetails.orderDate': orderDate || new Date(),
//           'orderDetails.expectedDeliveryDate': new Date(expectedDeliveryDate),
//           'orderDetails.totalCost': totalCost,
//           'orderDetails.notes': notes || ''
//         }
//       }
//     );

//     console.log('Update result:', updateResult);

//     res.json({
//       success: true,
//       message: `${updateResult.modifiedCount} requests sent to vendor successfully`,
//       updatedCount: updateResult.modifiedCount,
//       totalCost: Math.round(totalCost)
//     });

//   } catch (error) {
//     console.error('Bulk send to vendor error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send requests to vendor',
//       error: error.message 
//     });
//   }
// };
// 4. FIXED ownerController.js - Bulk Send to Vendor with proper validation
// exports.bulkSendToVendor = async (req, res) => {
//   try {
//     console.log('📦 === BULK SEND TO VENDOR ===');
//     console.log('Request body:', JSON.stringify(req.body, null, 2));

//     const { requestIds, vendorId, orderDate, expectedDeliveryDate, notes } = req.body;

//     // Comprehensive validation
//     if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'At least one request must be selected'
//       });
//     }

//     if (!vendorId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vendor is required'
//       });
//     }

//     if (!expectedDeliveryDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Expected delivery date is required'
//       });
//     }

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid vendor ID'
//       });
//     }

//     // Verify vendor exists
//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vendor not found'
//       });
//     }

//     // Convert request IDs to ObjectIds
//     const objectIds = requestIds
//       .filter(id => mongoose.Types.ObjectId.isValid(id))
//       .map(id => mongoose.Types.ObjectId(id));

//     if (objectIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No valid request IDs provided'
//       });
//     }

//     console.log(`Processing ${objectIds.length} requests...`);

//     // Fetch all requests with populated data
//     const requests = await StockRequest.find({
//       _id: { $in: objectIds },
//       status: 'Approved'
//     }).populate('tablet', 'name brand company price');

//     console.log(`Found ${requests.length} approved requests`);

//     if (requests.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No approved requests found'
//       });
//     }

//     // Calculate total cost
//     let totalCost = 0;
//     requests.forEach(req => {
//       const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
//       totalCost += cost;
//     });

//     console.log(`Total cost: ${totalCost}`);

//     // Update all requests
//     const updateResult = await StockRequest.updateMany(
//       { _id: { $in: objectIds } },
//       {
//         $set: {
//           status: 'Ordered',
//           'orderDetails.vendor': vendorId,
//           'orderDetails.orderDate': orderDate ? new Date(orderDate) : new Date(),
//           'orderDetails.expectedDeliveryDate': new Date(expectedDeliveryDate),
//           'orderDetails.totalCost': totalCost,
//           'orderDetails.notes': notes || ''
//         }
//       },
//       { multi: true }
//     );

//     console.log(`✓ Updated ${updateResult.modifiedCount} requests`);

//     res.json({
//       success: true,
//       message: `Successfully sent ${updateResult.modifiedCount} requests to ${vendor.name}`,
//       updatedCount: updateResult.modifiedCount,
//       vendor: {
//         id: vendor._id,
//         name: vendor.name,
//         email: vendor.email,
//         phone: vendor.phone
//       },
//       totalCost: Math.round(totalCost),
//       deliveryDate: expectedDeliveryDate
//     });

//   } catch (error) {
//     console.error('❌ Bulk send error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send requests to vendor',
//       error: error.message
//     });
//   }
// };

// 5. FIXED ownerController.js - Get Stock Requests with proper filtering
// exports.getStockRequests = async (req, res) => {
//   try {
//     const { page = 1, limit = 15, status, urgency, search, vendor } = req.query;

//     const query = {};

//     if (status) query.status = status;
//     if (urgency) query.urgencyLevel = urgency;
//     if (search) query.requestNumber = { $regex: search, $options: 'i' };
//     if (vendor && mongoose.Types.ObjectId.isValid(vendor)) {
//       query['orderDetails.vendor'] = mongoose.Types.ObjectId(vendor);
//     }

//     const requests = await StockRequest.find(query)
//       .populate('tablet', 'name brand company stock price')
//       .populate('requestedBy', 'name employeeId email')
//       .populate('orderDetails.vendor', 'name email phone')
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .lean();

//     const total = await StockRequest.countDocuments(query);

//     res.json({
//       success: true,
//       requests,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get stock requests error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch stock requests',
//       error: error.message
//     });
//   }
// };

// exports.bulkSendToVendor = async (req, res) => {
//   try {
//     console.log('=== Bulk Send to Vendor Request ===');
//     console.log('Request body:', JSON.stringify(req.body, null, 2));

//     const { 
//       requestIds, 
//       vendorId, 
//       orderDate, 
//       expectedDeliveryDate, 
//       notes 
//     } = req.body;

//     // Validation
//     if (!Array.isArray(requestIds) || requestIds.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No requests selected' 
//       });
//     }

//     if (!vendorId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Vendor is required' 
//       });
//     }

//     if (!expectedDeliveryDate) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Expected delivery date is required' 
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid vendor ID' 
//       });
//     }

//     console.log(`Processing ${requestIds.length} requests for vendor ${vendorId}`);

//     // Convert to ObjectIds
//     const objectIds = requestIds
//       .filter(id => mongoose.Types.ObjectId.isValid(id))
//       .map(id => mongoose.Types.ObjectId(id));

//     if (objectIds.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No valid request IDs provided' 
//       });
//     }

//     // Verify all requests exist and are approved
//     const requests = await StockRequest.find({
//       _id: { $in: objectIds },
//       status: 'Approved'
//     }).populate('tablet', 'price');

//     console.log(`Found ${requests.length} approved requests out of ${objectIds.length}`);

//     if (requests.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No approved requests found with the provided IDs' 
//       });
//     }

//     // Calculate total cost
//     const totalCost = requests.reduce((sum, req) => {
//       const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
//       return sum + cost;
//     }, 0);

//     console.log('Total cost calculated:', totalCost);

//     // Update all requests
//     const updateResult = await StockRequest.updateMany(
//       {
//         _id: { $in: objectIds },
//         status: 'Approved'
//       },
//       {
//         $set: {
//           status: 'Ordered',
//           'orderDetails.vendor': mongoose.Types.ObjectId(vendorId),
//           'orderDetails.orderDate': orderDate ? new Date(orderDate) : new Date(),
//           'orderDetails.expectedDeliveryDate': new Date(expectedDeliveryDate),
//           'orderDetails.totalCost': totalCost,
//           'orderDetails.notes': notes || ''
//         }
//       }
//     );

//     console.log('Update result:', updateResult);

//     res.json({
//       success: true,
//       message: `${updateResult.modifiedCount} request(s) sent to vendor successfully`,
//       updatedCount: updateResult.modifiedCount,
//       totalCost: Math.round(totalCost)
//     });

//   } catch (error) {
//     console.error('Bulk send to vendor error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send requests to vendor',
//       error: error.message 
//     });
//   }
// };

// Get Single Stock Request Details
// exports.getStockRequestById = async (req, res) => {
//   try {
//     const { requestId } = req.params;

//     const stockRequest = await StockRequest.findById(requestId)
//       .populate('tablet', 'name brand company strength price stock')
//       .populate('requestedBy', 'name employeeId department email phone')
//       .populate('reviewedBy', 'name')
//       .populate('preferredVendor', 'name email phone company')
//       .lean();

//     if (!stockRequest) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Stock request not found' 
//       });
//     }

//     res.json({
//       success: true,
//       request: stockRequest
//     });

//   } catch (error) {
//     console.error('Get stock request by ID error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock request details',
//       error: error.message 
//     });
//   }
// };

// Approve Stock Request
exports.approveStockRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const stockRequest = await StockRequest.findById(requestId)
      .populate('tablet', 'name brand stock')
      .populate('requestedBy', 'name employeeId');

    if (!stockRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock request not found' 
      });
    }

    if (stockRequest.status !== 'Pending' && stockRequest.status !== 'Under Review') {
      return res.status(400).json({ 
        success: false, 
        message: `Request is already ${stockRequest.status.toLowerCase()}` 
      });
    }

    stockRequest.status = 'Approved';
    stockRequest.reviewedBy = req.user._id;
    stockRequest.reviewedAt = new Date();

    await stockRequest.save();

    res.json({
      success: true,
      message: 'Stock request approved successfully',
      request: stockRequest
    });

  } catch (error) {
    console.error('Approve stock request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve stock request',
      error: error.message 
    });
  }
};

// Reject Stock Request
exports.rejectStockRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const stockRequest = await StockRequest.findById(requestId)
      .populate('tablet', 'name brand')
      .populate('requestedBy', 'name employeeId');

    if (!stockRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock request not found' 
      });
    }

    if (stockRequest.status !== 'Pending' && stockRequest.status !== 'Under Review') {
      return res.status(400).json({ 
        success: false, 
        message: `Request is already ${stockRequest.status.toLowerCase()}` 
      });
    }

    stockRequest.status = 'Rejected';
    stockRequest.reviewedBy = req.user._id;
    stockRequest.reviewedAt = new Date();
    stockRequest.adminNotes = reason;

    await stockRequest.save();

    res.json({
      success: true,
      message: 'Stock request rejected',
      request: stockRequest
    });

  } catch (error) {
    console.error('Reject stock request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject stock request',
      error: error.message 
    });
  }
};

// Send Single Request to Vendor
// exports.sendToVendor = async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { 
//       vendorId, 
//       orderDate, 
//       expectedDeliveryDate, 
//       notes 
//     } = req.body;

//     if (!vendorId || !expectedDeliveryDate) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Vendor ID and expected delivery date are required' 
//       });
//     }

//     const stockRequest = await StockRequest.findById(requestId)
//       .populate('tablet', 'name brand company price stock');

//     if (!stockRequest) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Stock request not found' 
//       });
//     }

//     if (stockRequest.status !== 'Approved') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Only approved requests can be sent to vendor' 
//       });
//     }

//     const totalCost = stockRequest.estimatedCost || 
//       (stockRequest.tablet.price * stockRequest.requestedQuantity);

//     stockRequest.orderDetails = {
//       vendor: vendorId,
//       orderDate: orderDate || new Date(),
//       expectedDeliveryDate: new Date(expectedDeliveryDate),
//       totalCost: totalCost,
//       notes: notes || ''
//     };

//     stockRequest.status = 'Ordered';
//     await stockRequest.save();

//     res.json({
//       success: true,
//       message: 'Order sent to vendor successfully',
//       request: stockRequest
//     });

//   } catch (error) {
//     console.error('Send to vendor error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send order to vendor',
//       error: error.message 
//     });
//   }
// };

// Send Single Request to Vendor - FIXED
// Send Single Request to Vendor - FIXED
// Send Single Request to Vendor - COMPLETELY FIXED
// exports.sendToVendor = async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { 
//       vendorId, 
//       orderDate, 
//       expectedDeliveryDate, 
//       notes 
//     } = req.body;

//     console.log('📤 Sending single request to vendor:', { requestId, vendorId });

//     // Validation
//     if (!vendorId || !expectedDeliveryDate) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Vendor ID and expected delivery date are required' 
//       });
//     }

//     // Find request
//     const stockRequest = await StockRequest.findById(requestId)
//       .populate('tablet', 'name brand company price stock');

//     if (!stockRequest) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Stock request not found' 
//       });
//     }

//     if (stockRequest.status !== 'Approved') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Only approved requests can be sent to vendor. Current status: ' + stockRequest.status 
//       });
//     }

//     // Calculate total cost
//     const totalCost = stockRequest.estimatedCost || 
//       ((stockRequest.tablet?.price || 0) * stockRequest.requestedQuantity);

//     // 🔥 FIX: Use direct assignment instead of mongoose.Types.ObjectId
//     stockRequest.status = 'Ordered';
//     stockRequest.orderDetails = {
//       vendor: vendorId, // Just pass the string ID
//       orderDate: orderDate ? new Date(orderDate) : new Date(),
//       expectedDeliveryDate: new Date(expectedDeliveryDate),
//       totalCost: totalCost,
//       notes: notes || ''
//     };

//     await stockRequest.save();

//     // Populate vendor info
//     const updatedRequest = await StockRequest.findById(requestId)
//       .populate('orderDetails.vendor', 'name company phone email')
//       .populate('tablet', 'name brand company')
//       .populate('requestedBy', 'name employeeId');

//     console.log('✅ Request sent to vendor successfully:', updatedRequest.requestNumber);

//     res.json({
//       success: true,
//       message: 'Order sent to vendor successfully',
//       request: updatedRequest
//     });

//   } catch (error) {
//     console.error('❌ Send to vendor error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send order to vendor',
//       error: error.message 
//     });
//   }
// };

// // Bulk Send to Vendor - COMPLETELY FIXED
// exports.bulkSendToVendor = async (req, res) => {
//   try {
//     console.log('=== Bulk Send to Vendor Request ===');
//     console.log('Request body:', JSON.stringify(req.body, null, 2));

//     const { 
//       requestIds, 
//       vendorId, 
//       orderDate, 
//       expectedDeliveryDate, 
//       notes 
//     } = req.body;

//     // Validation
//     if (!Array.isArray(requestIds) || requestIds.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No requests selected' 
//       });
//     }

//     if (!vendorId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Vendor is required' 
//       });
//     }

//     if (!expectedDeliveryDate) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Expected delivery date is required' 
//       });
//     }

//     console.log(`Processing ${requestIds.length} requests for vendor ${vendorId}`);

//     // Verify all requests exist and are approved
//     const requests = await StockRequest.find({
//       _id: { $in: requestIds },
//       status: 'Approved'
//     }).populate('tablet', 'price');

//     console.log(`Found ${requests.length} approved requests out of ${requestIds.length}`);

//     if (requests.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No approved requests found with the provided IDs' 
//       });
//     }

//     // Calculate total cost
//     const totalCost = requests.reduce((sum, req) => {
//       const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
//       return sum + cost;
//     }, 0);

//     console.log('Total cost calculated:', totalCost);

//     // 🔥 FIX: Update each request individually to avoid ObjectId constructor issue
//     let updatedCount = 0;
//     const errors = [];

//     for (const requestId of requestIds) {
//       try {
//         const request = await StockRequest.findOne({ 
//           _id: requestId, 
//           status: 'Approved' 
//         });

//         if (request) {
//           request.status = 'Ordered';
//           request.orderDetails = {
//             vendor: vendorId, // Just pass the string ID
//             orderDate: orderDate ? new Date(orderDate) : new Date(),
//             expectedDeliveryDate: new Date(expectedDeliveryDate),
//             totalCost: totalCost / requestIds.length, // Distribute cost
//             notes: notes || ''
//           };
          
//           await request.save();
//           updatedCount++;
//           console.log(`✅ Updated request: ${request.requestNumber}`);
//         }
//       } catch (error) {
//         console.error(`❌ Error updating request ${requestId}:`, error.message);
//         errors.push({ requestId, error: error.message });
//       }
//     }

//     console.log(`Update complete: ${updatedCount} successful, ${errors.length} failed`);

//     if (updatedCount === 0) {
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to update any requests',
//         errors
//       });
//     }

//     res.json({
//       success: true,
//       message: `${updatedCount} request(s) sent to vendor successfully`,
//       updatedCount: updatedCount,
//       totalCost: Math.round(totalCost),
//       errors: errors.length > 0 ? errors : undefined
//     });

//   } catch (error) {
//     console.error('Bulk send to vendor error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send requests to vendor',
//       error: error.message 
//     });
//   }
// };


// Send Single Request to Vendor - COMPLETELY FIXED
exports.sendToVendor = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { 
      vendorId, 
      orderDate, 
      expectedDeliveryDate, 
      notes 
    } = req.body;

    console.log('📤 Sending single request to vendor:', { requestId, vendorId });

    // Validation
    if (!vendorId || !expectedDeliveryDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor ID and expected delivery date are required' 
      });
    }

    // Find request
    const stockRequest = await StockRequest.findById(requestId)
      .populate('tablet', 'name brand company price stock');

    if (!stockRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock request not found' 
      });
    }

    if (stockRequest.status !== 'Approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved requests can be sent to vendor. Current status: ' + stockRequest.status 
      });
    }

    // Calculate total cost
    const totalCost = stockRequest.estimatedCost || 
      ((stockRequest.tablet?.price || 0) * stockRequest.requestedQuantity);

    // 🔥 FIX: Direct assignment - NO ObjectId constructor
    stockRequest.status = 'Ordered';
    
    // Initialize orderDetails if it doesn't exist
    if (!stockRequest.orderDetails) {
      stockRequest.orderDetails = {};
    }
    
    stockRequest.orderDetails.vendor = vendorId; // Just the string ID
    stockRequest.orderDetails.orderDate = orderDate ? new Date(orderDate) : new Date();
    stockRequest.orderDetails.expectedDeliveryDate = new Date(expectedDeliveryDate);
    stockRequest.orderDetails.totalCost = totalCost;
    stockRequest.orderDetails.notes = notes || '';

    await stockRequest.save();

    // Populate vendor info for response
    const updatedRequest = await StockRequest.findById(requestId)
      .populate('orderDetails.vendor', 'name company phone email')
      .populate('tablet', 'name brand company')
      .populate('requestedBy', 'name employeeId');

    console.log('✅ Request sent to vendor successfully:', updatedRequest.requestNumber);

    res.json({
      success: true,
      message: 'Order sent to vendor successfully',
      request: updatedRequest
    });

  } catch (error) {
    console.error('❌ Send to vendor error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send order to vendor',
      error: error.message 
    });
  }
};


// Bulk Send to Vendor - ABSOLUTELY FINAL VERSION
exports.bulkSendToVendor = async (req, res) => {
  try {
    console.log('📦 Bulk send to vendor request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { 
      requestIds, 
      vendorId, 
      orderDate, 
      expectedDeliveryDate, 
      notes 
    } = req.body;

    // Validation
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      console.log('❌ Validation failed: No request IDs');
      return res.status(400).json({ 
        success: false, 
        message: 'No requests selected' 
      });
    }

    if (!vendorId) {
      console.log('❌ Validation failed: No vendor ID');
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor is required' 
      });
    }

    if (!expectedDeliveryDate) {
      console.log('❌ Validation failed: No delivery date');
      return res.status(400).json({ 
        success: false, 
        message: 'Expected delivery date is required' 
      });
    }

    console.log(`✅ Validation passed. Processing ${requestIds.length} requests for vendor ${vendorId}`);

    // Update each request one by one
    let updatedCount = 0;
    const errors = [];
    const updatedRequests = [];

    for (let i = 0; i < requestIds.length; i++) {
      const requestId = requestIds[i];
      console.log(`\n📝 Processing request ${i + 1}/${requestIds.length}: ${requestId}`);
      
      try {
        // Find the request
        const request = await StockRequest.findOne({ 
          _id: requestId, 
          status: 'Approved' 
        }).populate('tablet', 'price');

        if (!request) {
          console.log(`⚠️ Request ${requestId} not found or not approved`);
          errors.push({ requestId, error: 'Request not found or not approved' });
          continue;
        }

        console.log(`✅ Found request: ${request.requestNumber}`);

        // Calculate cost for this request
        const cost = request.estimatedCost || (request.tablet?.price || 0) * request.requestedQuantity;
        console.log(`💰 Cost calculated: ${cost}`);

        // Update status
        request.status = 'Ordered';
        
        // Update orderDetails - NO OBJECTID CONSTRUCTOR
        request.orderDetails = {
          vendor: vendorId,  // Direct string assignment
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDeliveryDate: new Date(expectedDeliveryDate),
          totalCost: cost,
          notes: notes || '',
          actualDeliveryDate: null,
          invoiceNumber: '',
          receivedQuantity: 0
        };

        // Save
        await request.save();
        
        updatedCount++;
        updatedRequests.push(request.requestNumber);
        console.log(`✅ Successfully updated: ${request.requestNumber}`);

      } catch (error) {
        console.error(`❌ Error updating request ${requestId}:`, error.message);
        console.error('Error stack:', error.stack);
        errors.push({ requestId, error: error.message });
      }
    }

    console.log(`\n✅ Bulk update complete:`);
    console.log(`   - Successful: ${updatedCount}`);
    console.log(`   - Failed: ${errors.length}`);
    console.log(`   - Updated requests: ${updatedRequests.join(', ')}`);

    if (updatedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update any requests',
        errors
      });
    }

    // Calculate total cost
    const totalCost = await StockRequest.aggregate([
      { $match: { requestNumber: { $in: updatedRequests } } },
      { $group: { _id: null, total: { $sum: '$orderDetails.totalCost' } } }
    ]);

    res.json({
      success: true,
      message: `${updatedCount} request(s) sent to vendor successfully`,
      updatedCount: updatedCount,
      totalCost: Math.round(totalCost[0]?.total || 0),
      updatedRequests: updatedRequests,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Bulk send to vendor error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send requests to vendor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Mark Stock as Received
exports.markStockReceived = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { 
      receivedQuantity, 
      actualDeliveryDate, 
      invoiceNumber,
      actualCost 
    } = req.body;

    const stockRequest = await StockRequest.findById(requestId)
      .populate('tablet');

    if (!stockRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock request not found' 
      });
    }

    if (stockRequest.status !== 'Ordered') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only ordered requests can be marked as received' 
      });
    }

    stockRequest.orderDetails.actualDeliveryDate = actualDeliveryDate || new Date();
    stockRequest.orderDetails.receivedQuantity = receivedQuantity || stockRequest.requestedQuantity;
    stockRequest.orderDetails.invoiceNumber = invoiceNumber;
    
    if (actualCost) {
      stockRequest.orderDetails.totalCost = actualCost;
    }

    stockRequest.status = 'Received';
    await stockRequest.save();

    // Update medicine stock
    const medicine = await Tablet.findById(stockRequest.tablet._id);
    if (medicine) {
      medicine.stock += (receivedQuantity || stockRequest.requestedQuantity);
      await medicine.save();
    }

    res.json({
      success: true,
      message: 'Stock received and inventory updated',
      request: stockRequest
    });

  } catch (error) {
    console.error('Mark stock received error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark stock as received',
      error: error.message 
    });
  }
};

// Get Single Stock Request Details
exports.getStockRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const stockRequest = await StockRequest.findById(requestId)
      .populate('tablet', 'name brand company strength price stock')
      .populate('requestedBy', 'name employeeId department email phone')
      .populate('reviewedBy', 'name')
      .populate('orderDetails.vendor', 'name email phone')
      .lean();

    if (!stockRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock request not found' 
      });
    }

    res.json({
      success: true,
      request: stockRequest
    });

  } catch (error) {
    console.error('Get stock request by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stock request details',
      error: error.message 
    });
  }
};



// Add this to ownerController.js - REPLACE the existing getStockRequests function

// Get Stock Requests - COMPLETELY FIXED
// exports.getStockRequests = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 15, 
//       status, 
//       urgency, 
//       search,
//       vendor 
//     } = req.query;

//     console.log('📥 Fetching stock requests with filters:', { status, urgency, search, vendor });

//     const query = {};

//     // FIXED: Only add filters if they exist
//     if (status && status !== '') {
//       query.status = status;
//     }
    
//     if (urgency && urgency !== '') {
//       query.urgencyLevel = urgency;
//     }
    
//     if (search && search.trim() !== '') {
//       query.$or = [
//         { requestNumber: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     // Vendor filter - only for ordered requests
//     if (vendor && vendor !== '' && mongoose.Types.ObjectId.isValid(vendor)) {
//       query['orderDetails.vendor'] = mongoose.Types.ObjectId(vendor);
//     }

//     console.log('🔍 Final query:', JSON.stringify(query));

//     const requests = await StockRequest.find(query)
//       .populate('tablet', 'name brand company strength price category stock')
//       .populate('requestedBy', 'name employeeId department email')
//       .populate('reviewedBy', 'name')
//       .populate('orderDetails.vendor', 'name company phone email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     const totalRequests = await StockRequest.countDocuments(query);

//     console.log(`✅ Found ${requests.length} requests (Total: ${totalRequests})`);

//     res.json({
//       success: true,
//       requests,
//       totalPages: Math.ceil(totalRequests / limit),
//       currentPage: parseInt(page),
//       totalRequests
//     });

//   } catch (error) {
//     console.error('❌ Get stock requests error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock requests',
//       error: error.message 
//     });
//   }
// };

// Replace in ownerController.js

// exports.getStockRequests = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 15, 
//       status, 
//       urgency, 
//       search,
//       vendor 
//     } = req.query;

//     console.log('📥 Fetching stock requests with filters:', { status, urgency, search, vendor, page, limit });

//     const query = {};

//     // Filter by status
//     if (status && status !== '') {
//       query.status = status;
//     }

//     // Filter by urgency
//     if (urgency && urgency !== '') {
//       query.urgencyLevel = urgency;
//     }

//     // Search by request number
//     if (search && search !== '') {
//       query.requestNumber = { $regex: search, $options: 'i' };
//     }
    
//     // Filter by vendor - ONLY check orderDetails.vendor
//     if (vendor && vendor !== '' && mongoose.Types.ObjectId.isValid(vendor)) {
//       query['orderDetails.vendor'] = mongoose.Types.ObjectId(vendor);
//     }

//     console.log('🔍 Query:', JSON.stringify(query, null, 2));

//     // 🔥 FIX: Fetch with proper error handling
//     const requests = await StockRequest.find(query)
//       .populate('tablet', 'name brand company strength price category stock minStockLevel')
//       .populate('requestedBy', 'name employeeId department email phone')
//       .populate('reviewedBy', 'name email')
//       .populate({
//         path: 'orderDetails.vendor',
//         select: 'name company phone email'
//       })
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .lean()
//       .catch(err => {
//         console.error('❌ Populate error:', err);
//         // If populate fails, fetch without populate
//         return StockRequest.find(query)
//           .sort({ createdAt: -1 })
//           .limit(parseInt(limit))
//           .skip((parseInt(page) - 1) * parseInt(limit))
//           .lean();
//       });

//     // Get total count for pagination
//     const totalRequests = await StockRequest.countDocuments(query);

//     console.log(`✅ Found ${requests.length} requests (Total: ${totalRequests})`);

//     res.json({
//       success: true,
//       requests,
//       totalPages: Math.ceil(totalRequests / limit),
//       currentPage: parseInt(page),
//       totalRequests
//     });

//   } catch (error) {
//     console.error('❌ Get stock requests error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock requests',
//       error: error.message 
//     });
//   }
// };

// its working fine now aftere long ^

// Replace in ownerController.js

// exports.getStockRequests = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 15, 
//       status, 
//       urgency, 
//       search,
//       vendor 
//     } = req.query;

//     console.log('📥 Fetching stock requests with filters:', { status, urgency, search, vendor, page, limit });

//     const query = {};

//     // Filter by status
//     if (status && status !== '') {
//       query.status = status;
//     }

//     // Filter by urgency
//     if (urgency && urgency !== '') {
//       query.urgencyLevel = urgency;
//     }

//     // Search by request number
//     if (search && search !== '') {
//       query.requestNumber = { $regex: search, $options: 'i' };
//     }
    
//     // Filter by vendor - ONLY check orderDetails.vendor
//     if (vendor && vendor !== '' && mongoose.Types.ObjectId.isValid(vendor)) {
//       query['orderDetails.vendor'] = mongoose.Types.ObjectId(vendor);
//     }

//     console.log('🔍 Query:', JSON.stringify(query, null, 2));

//     // 🔥 COMPLETE FIX: Fetch without populate first, then manually populate valid ones
//     const requests = await StockRequest.find(query)
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .lean();

//     // 🔥 Manually populate fields safely
//     const Tablet = mongoose.model('Tablet');
//     const Worker = mongoose.model('Worker');
//     const Owner = mongoose.model('Owner');
//     const Vendor = mongoose.model('Vendor');

//     for (let request of requests) {
//       // Populate tablet
//       if (request.tablet && mongoose.Types.ObjectId.isValid(request.tablet)) {
//         request.tablet = await Tablet.findById(request.tablet)
//           .select('name brand company strength price category stock minStockLevel')
//           .lean();
//       }

//       // Populate requestedBy
//       if (request.requestedBy && mongoose.Types.ObjectId.isValid(request.requestedBy)) {
//         request.requestedBy = await Worker.findById(request.requestedBy)
//           .select('name employeeId department email phone')
//           .lean();
//       }

//       // Populate reviewedBy
//       if (request.reviewedBy && mongoose.Types.ObjectId.isValid(request.reviewedBy)) {
//         request.reviewedBy = await Owner.findById(request.reviewedBy)
//           .select('name email')
//           .lean();
//       }

//       // 🔥 Safely populate orderDetails.vendor
//       if (request.orderDetails && 
//           request.orderDetails.vendor && 
//           mongoose.Types.ObjectId.isValid(request.orderDetails.vendor)) {
//         try {
//           request.orderDetails.vendor = await Vendor.findById(request.orderDetails.vendor)
//             .select('name company phone email')
//             .lean();
//         } catch (err) {
//           console.log(`⚠️ Failed to populate vendor for request ${request.requestNumber}`);
//           request.orderDetails.vendor = null;
//         }
//       } else if (request.orderDetails && request.orderDetails.vendor) {
//         // Invalid vendor ID - clear it
//         console.log(`⚠️ Invalid vendor ID in request ${request.requestNumber}: ${request.orderDetails.vendor}`);
//         request.orderDetails.vendor = null;
//       }
//     }

//     // Get total count for pagination
//     const totalRequests = await StockRequest.countDocuments(query);

//     console.log(`✅ Found ${requests.length} requests (Total: ${totalRequests})`);

//     res.json({
//       success: true,
//       requests,
//       totalPages: Math.ceil(totalRequests / limit),
//       currentPage: parseInt(page),
//       totalRequests
//     });

//   } catch (error) {
//     console.error('❌ Get stock requests error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock requests',
//       error: error.message 
//     });
//   }
// };
// 18-11

// Get Stock Requests - FIXED for vendor filter
exports.getStockRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      status, 
      urgency, 
      search,
      vendor 
    } = req.query;

    console.log('📥 Fetching stock requests with filters:', { status, urgency, search, vendor, page, limit });

    const query = {};

    // Status filter
    if (status && status !== '') {
      query.status = status;
    }
    
    // Urgency filter
    if (urgency && urgency !== '') {
      query.urgencyLevel = urgency;
    }
    
    // Search filter
    if (search && search.trim() !== '') {
      query.$or = [
        { requestNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 🔥 FIXED: Vendor filter - NO ObjectId constructor
    if (vendor && vendor !== '') {
      // Just use the string directly, Mongoose will handle it
      query['orderDetails.vendor'] = vendor;
      console.log('🔍 Filtering by vendor:', vendor);
    }

    console.log('🔍 Final query:', JSON.stringify(query));

    // Fetch requests
    const requests = await StockRequest.find(query)
      .populate('tablet', 'name brand company strength price category stock')
      .populate('requestedBy', 'name employeeId department email')
      .populate('reviewedBy', 'name')
      .populate('orderDetails.vendor', 'name company phone email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const totalRequests = await StockRequest.countDocuments(query);

    console.log(`✅ Found ${requests.length} requests (Total: ${totalRequests})`);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(totalRequests / limit),
      currentPage: parseInt(page),
      totalRequests
    });

  } catch (error) {
    console.error('❌ Get stock requests error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stock requests',
      error: error.message 
    });
  }
};
// Replace in ownerController.js - Line ~2690

// exports.getStockRequests = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 15, 
//       status, 
//       urgency, 
//       search,
//       vendor 
//     } = req.query;

//     console.log('📥 Fetching stock requests with filters:', { status, urgency, search, vendor, page, limit });

//     const query = {};

//     // Filter by status
//     if (status && status !== '') {
//       query.status = status;
//     }

//     // Filter by urgency
//     if (urgency && urgency !== '') {
//       query.urgencyLevel = urgency;
//     }

//     // Search by request number
//     if (search && search !== '') {
//       query.requestNumber = { $regex: search, $options: 'i' };
//     }
    
//     // Filter by vendor - ONLY check orderDetails.vendor
//     if (vendor && vendor !== '' && mongoose.Types.ObjectId.isValid(vendor)) {
//       query['orderDetails.vendor'] = mongoose.Types.ObjectId(vendor);
//     }

//     console.log('📝 Query:', JSON.stringify(query, null, 2));

//     // Fetch requests - REMOVED preferredVendor population
//     const requests = await StockRequest.find(query)
//       .populate('tablet', 'name brand company strength price category stock minStockLevel')
//       .populate('requestedBy', 'name employeeId department email phone')
//       .populate('reviewedBy', 'name email')
//       .populate('orderDetails.vendor', 'name company phone email') // Only this vendor field
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .lean();

//     // Get total count for pagination
//     const totalRequests = await StockRequest.countDocuments(query);

//     console.log(`✅ Found ${requests.length} requests (Total: ${totalRequests})`);

//     res.json({
//       success: true,
//       requests,
//       totalPages: Math.ceil(totalRequests / limit),
//       currentPage: parseInt(page),
//       totalRequests
//     });

//   } catch (error) {
//     console.error('❌ Get stock requests error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock requests',
//       error: error.message 
//     });
//   }
// };

// Also update getStockRequestStats to remove preferredVendor
// exports.getStockRequestStats = async (req, res) => {
//   try {
//     console.log('📊 Fetching stock request stats...');

//     const [
//       pending,
//       approved,
//       rejected,
//       critical,
//       underReview,
//       ordered,
//       received
//     ] = await Promise.all([
//       StockRequest.countDocuments({ status: 'Pending' }),
//       StockRequest.countDocuments({ status: 'Approved' }),
//       StockRequest.countDocuments({ status: 'Rejected' }),
//       StockRequest.countDocuments({ 
//         urgencyLevel: 'Critical', 
//         status: { $in: ['Pending', 'Under Review', 'Approved'] } 
//       }),
//       StockRequest.countDocuments({ status: 'Under Review' }),
//       StockRequest.countDocuments({ status: 'Ordered' }),
//       StockRequest.countDocuments({ status: 'Received' })
//     ]);

//     // Count unique vendors - use orderDetails.vendor instead of preferredVendor
//     const uniqueVendorsResult = await StockRequest.aggregate([
//       { 
//         $match: { 
//           status: 'Ordered',
//           'orderDetails.vendor': { $exists: true, $ne: null }
//         } 
//       },
//       {
//         $group: {
//           _id: '$orderDetails.vendor'
//         }
//       },
//       {
//         $count: 'uniqueCount'
//       }
//     ]);

//     const uniqueVendors = uniqueVendorsResult[0]?.uniqueCount || 0;

//     // Get total estimated cost of pending requests
//     const pendingCostResult = await StockRequest.aggregate([
//       { 
//         $match: { 
//           status: { $in: ['Pending', 'Under Review'] },
//           estimatedCost: { $exists: true }
//         } 
//       },
//       { 
//         $group: { 
//           _id: null, 
//           totalEstimatedCost: { $sum: '$estimatedCost' } 
//         } 
//       }
//     ]);

//     const totalEstimatedCost = pendingCostResult[0]?.totalEstimatedCost || 0;

//     const stats = {
//       success: true,
//       pending,
//       approved,
//       rejected,
//       critical,
//       underReview,
//       ordered,
//       received,
//       uniqueVendors,
//       totalEstimatedCost: Math.round(totalEstimatedCost)
//     };

//     console.log('✅ Stats:', stats);

//     res.json(stats);

//   } catch (error) {
//     console.error('❌ Get stock request stats error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch stock request stats',
//       error: error.message 
//     });
//   }
// };

// Also REPLACE getStockRequestStats
exports.getStockRequestStats = async (req, res) => {
  try {
    console.log('📊 Fetching stock request stats...');

    const [
      pending,
      approved,
      rejected,
      critical,
      underReview,
      ordered,
      received
    ] = await Promise.all([
      StockRequest.countDocuments({ status: 'Pending' }),
      StockRequest.countDocuments({ status: 'Approved' }),
      StockRequest.countDocuments({ status: 'Rejected' }),
      StockRequest.countDocuments({ 
        urgencyLevel: 'Critical', 
        status: { $in: ['Pending', 'Under Review', 'Approved'] } 
      }),
      StockRequest.countDocuments({ status: 'Under Review' }),
      StockRequest.countDocuments({ status: 'Ordered' }),
      StockRequest.countDocuments({ status: 'Received' })
    ]);

    // Count unique vendors with approved requests
    const uniqueVendorsResult = await StockRequest.aggregate([
      { 
        $match: { 
          status: 'Approved',
          preferredVendor: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$preferredVendor'
        }
      },
      {
        $count: 'uniqueCount'
      }
    ]);

    const uniqueVendors = uniqueVendorsResult[0]?.uniqueCount || 0;

    // Get total estimated cost of pending requests
    const pendingCostResult = await StockRequest.aggregate([
      { 
        $match: { 
          status: { $in: ['Pending', 'Under Review'] },
          estimatedCost: { $exists: true }
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalEstimatedCost: { $sum: '$estimatedCost' } 
        } 
      }
    ]);

    const totalEstimatedCost = pendingCostResult[0]?.totalEstimatedCost || 0;

    const stats = {
      success: true,
      pending,
      approved,
      rejected,
      critical,
      underReview,
      ordered,
      received,
      uniqueVendors,
      totalEstimatedCost: Math.round(totalEstimatedCost)
    };

    console.log('✅ Stats:', stats);

    res.json(stats);

  } catch (error) {
    console.error('❌ Get stock request stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stock request stats',
      error: error.message 
    });
  }
};      


// Also REPLACE getVendorsWithRequestCounts
// Get Vendors with Request Counts - FIXED
exports.getVendorsWithRequestCounts = async (req, res) => {
  try {
    console.log('🏢 Getting vendors with request counts...');
    
    // Get all active vendors
    const vendors = await Vendor.find({ isActive: true }).lean();
    console.log('📋 Total vendors found:', vendors.length);

    // Get counts for each vendor - NO ObjectId constructor
    const vendorIds = vendors.map(v => v._id.toString());
    
    const requestCounts = await StockRequest.aggregate([
      {
        $match: {
          status: 'Ordered',
          'orderDetails.vendor': { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          vendorIdString: { $toString: '$orderDetails.vendor' }
        }
      },
      {
        $group: {
          _id: '$vendorIdString',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Approved request counts:', requestCounts);

    // Create map of vendor counts
    const countMap = {};
    requestCounts.forEach(item => {
      countMap[item._id] = item.count;
    });

    // Combine vendors with counts
    const vendorsWithCounts = vendors.map(vendor => ({
      _id: vendor._id,
      name: vendor.name,
      company: vendor.company,
      email: vendor.email,
      phone: vendor.phone,
      contactPerson: vendor.contactPerson,
      approvedRequestCount: countMap[vendor._id.toString()] || 0,
      isActive: vendor.isActive
    }));

    // Sort by count descending
    vendorsWithCounts.sort((a, b) => b.approvedRequestCount - a.approvedRequestCount);

    console.log('✅ Vendors with counts prepared:', vendorsWithCounts.length);

    res.json({
      success: true,
      vendors: vendorsWithCounts
    });

  } catch (error) {
    console.error('❌ Get vendors with request counts error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vendors',
      error: error.message 
    });
  }
};

// Also REPLACE bulkSendToVendor
// Replace the entire bulkSendToVendor function in ownerController.js

exports.bulkSendToVendor = async (req, res) => {
  try {
    console.log('📦 Bulk send to vendor request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { 
      requestIds, 
      vendorId, 
      orderDate, 
      expectedDeliveryDate, 
      notes 
    } = req.body;

    // Validation
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      console.log('❌ No request IDs provided');
      return res.status(400).json({ 
        success: false, 
        message: 'No requests selected' 
      });
    }

    if (!vendorId) {
      console.log('❌ No vendor ID provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Vendor is required' 
      });
    }

    if (!expectedDeliveryDate) {
      console.log('❌ No delivery date provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Expected delivery date is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      console.log('❌ Invalid vendor ID');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid vendor ID' 
      });
    }

    console.log(`✅ Processing ${requestIds.length} requests for vendor ${vendorId}`);

    // Convert to ObjectIds - 🔥 FIXED: Use 'new' keyword
    const objectIds = requestIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id)); // ⚡ ADDED 'new'

    if (objectIds.length === 0) {
      console.log('❌ No valid request IDs');
      return res.status(400).json({ 
        success: false, 
        message: 'No valid request IDs provided' 
      });
    }

    console.log(`✅ Valid IDs: ${objectIds.length}`);

    // Verify all requests exist and are approved
    const requests = await StockRequest.find({
      _id: { $in: objectIds },
      status: 'Approved'
    }).populate('tablet', 'price');

    console.log(`✅ Found ${requests.length} approved requests out of ${objectIds.length}`);

    if (requests.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No approved requests found with the provided IDs' 
      });
    }

    // Calculate total cost
    const totalCost = requests.reduce((sum, req) => {
      const cost = req.estimatedCost || (req.tablet?.price || 0) * req.requestedQuantity;
      return sum + cost;
    }, 0);

    console.log(`💰 Total cost calculated: ₹${totalCost}`);

    // 🔥 FIXED: Use 'new' keyword for ObjectId
    const updateResult = await StockRequest.updateMany(
      {
        _id: { $in: objectIds },
        status: 'Approved'
      },
      {
        $set: {
          status: 'Ordered',
          'orderDetails.vendor': new mongoose.Types.ObjectId(vendorId), // ⚡ ADDED 'new'
          'orderDetails.orderDate': orderDate ? new Date(orderDate) : new Date(),
          'orderDetails.expectedDeliveryDate': new Date(expectedDeliveryDate),
          'orderDetails.totalCost': totalCost,
          'orderDetails.notes': notes || ''
        }
      }
    );

    console.log('✅ Update result:', updateResult);

    res.json({
      success: true,
      message: `${updateResult.modifiedCount} request(s) sent to vendor successfully`,
      updatedCount: updateResult.modifiedCount,
      totalCost: Math.round(totalCost)
    });

  } catch (error) {
    console.error('❌ Bulk send to vendor error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send requests to vendor',
      error: error.message 
    });
  }
};