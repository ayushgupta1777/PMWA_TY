// backend/src/routes/ownerRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ownerController = require('../controllers/ownerController');

// Get auth functions
const authFile = require('../middleware/authMiddleware.js');
// const requireOwner = authFile.requireOwner || ((req, res, next) => {
//   if (req.user?.role !== 'owner') {
//     return res.status(403).json({ message: 'Access denied: Owner only' });
//   }
//   next();
// });

// All routes require owner authentication
// router.use(authMiddleware, requireOwner);
router.use(authMiddleware);


// ===== DASHBOARD ROUTES =====
router.get('/dashboard/stats', ownerController.getDashboardStats);
router.get('/dashboard/config', ownerController.getDashboardConfig);
router.put('/dashboard/config', ownerController.updateDashboardConfig);

// ===== WORKER MANAGEMENT ROUTES =====
router.get('/workers', ownerController.getAllWorkers);
router.get('/workers/performance', ownerController.getWorkerPerformance);
router.get('/workers/:workerId/details', ownerController.getWorkerDetails);
router.get('/workers/:workerId/sales', ownerController.getWorkerSalesHistory);
router.post('/workers', ownerController.createWorker);
router.put('/workers/:workerId', ownerController.updateWorker);
router.delete('/workers/:workerId', ownerController.deleteWorker);
router.patch('/workers/:workerId/toggle-status', ownerController.toggleWorkerStatus);

// ===== INVENTORY MANAGEMENT ROUTES =====
router.get('/inventory/alerts', ownerController.getStockAlerts);
router.get('/inventory/overview', ownerController.getInventoryOverview);
router.get('/medicines', ownerController.getAllMedicines);
router.post('/medicines', ownerController.createMedicine);
router.put('/medicines/:medicineId', ownerController.updateMedicine);
router.delete('/medicines/:medicineId', ownerController.deleteMedicine);
router.patch('/medicines/:medicineId/stock', ownerController.updateStock);
router.post('/medicines/bulk-stock-update', ownerController.bulkUpdateStock);

// ===== ANALYTICS ROUTES =====
router.get('/analytics/revenue', ownerController.getRevenueAnalytics);
router.get('/analytics/top-medicines', ownerController.getTopSellingMedicines);
router.get('/analytics/demand/:medicineId', ownerController.getDemandPatterns);
router.get('/sales/trends', ownerController.getSalesTrends);

// ===== ALERTS ROUTES =====
router.get('/alerts/critical', ownerController.getCriticalAlerts);
router.get('/notifications', ownerController.getNotifications);
router.patch('/notifications/:notificationId/read', ownerController.markNotificationRead);
router.patch('/notifications/read-all', ownerController.markAllNotificationsRead);

// ===== REPORTS ROUTES =====
router.get('/reports/sales', ownerController.generateSalesReport);
router.get('/reports/inventory', ownerController.generateInventoryReport);
router.get('/reports/worker/:workerId', ownerController.generateWorkerReport);

// ===== SETTINGS ROUTES =====
router.get('/settings', ownerController.getSettings);
router.put('/settings', ownerController.updateSettings);

// ===== STOCK REQUEST ROUTES ===== 
// ⚠️ CRITICAL: These routes MUST come BEFORE the /:requestId route

// Get stock request statistics (MUST be before /:requestId)
router.get('/stock-requests/stats', ownerController.getStockRequestStats);

// Get vendors with their approved request counts (MUST be before /:requestId)
router.get('/stock-requests/vendors-with-counts', ownerController.getVendorsWithRequestCounts);

// Bulk send approved requests to vendor (MUST be before /:requestId)
router.post('/stock-requests/bulk-send-to-vendor', ownerController.bulkSendToVendor);

// Get all stock requests with filters (MUST be before /:requestId)
router.get('/stock-requests', ownerController.getStockRequests);

// Get single stock request details
router.get('/stock-requests/:requestId', ownerController.getStockRequestById);

// Approve a stock request
router.patch('/stock-requests/:requestId/approve', ownerController.approveStockRequest);

// Reject a stock request
router.patch('/stock-requests/:requestId/reject', ownerController.rejectStockRequest);

// Send single request to vendor
router.post('/stock-requests/:requestId/send-to-vendor', ownerController.sendToVendor);

// Mark stock as received
router.patch('/stock-requests/:requestId/received', ownerController.markStockReceived);

module.exports = router;


// // backend/src/routes/ownerRoutes.js
// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware');

// const authFile = require('../middleware/authMiddleware.js');

// const requireOwner = authFile.requireOwner || ((req, res, next) => {
//   if (req.user?.role !== 'owner') {
//     return res.status(403).json({ message: 'Access denied: Owner only' });
//   }
//   next();
// });


// const ownerController = require('../controllers/ownerController');

// // All routes require owner authentication
// router.use(authMiddleware, requireOwner);

// // ===== DASHBOARD ROUTES =====
// router.get('/dashboard/stats', ownerController.getDashboardStats);
// router.get('/dashboard/config', ownerController.getDashboardConfig);
// router.put('/dashboard/config', ownerController.updateDashboardConfig);

// // ===== WORKER MANAGEMENT ROUTES =====
// router.get('/workers', ownerController.getAllWorkers);
// router.get('/workers/performance', ownerController.getWorkerPerformance);
// router.get('/workers/:workerId/details', ownerController.getWorkerDetails);
// router.get('/workers/:workerId/sales', ownerController.getWorkerSalesHistory);
// router.post('/workers', ownerController.createWorker);
// router.put('/workers/:workerId', ownerController.updateWorker);
// router.delete('/workers/:workerId', ownerController.deleteWorker);
// router.patch('/workers/:workerId/toggle-status', ownerController.toggleWorkerStatus);

// // ===== INVENTORY MANAGEMENT ROUTES =====
// router.get('/inventory/alerts', ownerController.getStockAlerts);
// router.get('/inventory/overview', ownerController.getInventoryOverview);
// router.get('/medicines', ownerController.getAllMedicines);
// router.post('/medicines', ownerController.createMedicine);
// router.put('/medicines/:medicineId', ownerController.updateMedicine);
// router.delete('/medicines/:medicineId', ownerController.deleteMedicine);
// router.patch('/medicines/:medicineId/stock', ownerController.updateStock);
// router.post('/medicines/bulk-stock-update', ownerController.bulkUpdateStock);

// // ===== ANALYTICS ROUTES =====
// router.get('/analytics/revenue', ownerController.getRevenueAnalytics);
// router.get('/analytics/top-medicines', ownerController.getTopSellingMedicines);
// router.get('/analytics/demand/:medicineId', ownerController.getDemandPatterns);
// router.get('/sales/trends', ownerController.getSalesTrends);

// // ===== ALERTS ROUTES =====
// router.get('/alerts/critical', ownerController.getCriticalAlerts);
// router.get('/notifications', ownerController.getNotifications);
// router.patch('/notifications/:notificationId/read', ownerController.markNotificationRead);
// router.patch('/notifications/read-all', ownerController.markAllNotificationsRead);

// // ===== REPORTS ROUTES =====
// router.get('/reports/sales', ownerController.generateSalesReport);
// router.get('/reports/inventory', ownerController.generateInventoryReport);
// router.get('/reports/worker/:workerId', ownerController.generateWorkerReport);

// // ===== SETTINGS ROUTES =====
// router.get('/settings', ownerController.getSettings);
// router.put('/settings', ownerController.updateSettings);



// // Add these routes to ownerRoutes.js (in the appropriate section)

// // ===== STOCK REQUEST ROUTES =====
// // Get all stock requests with filters (including vendor filter)
// // router.get('/stock-requests', ownerController.getStockRequests);

// // Add logging middleware for stock requests
// router.use('/stock-requests', (req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
//   console.log('Query:', req.query);
//   console.log('Body:', req.body);
//   next();
// });
// // Get stock request statistics including unique vendors count
// router.get('/stock-requests/stats', ownerController.getStockRequestStats);

// // Get vendors with their approved request counts (NEW)
// router.get('/stock-requests/vendors-with-counts', ownerController.getVendorsWithRequestCounts);

// // Get single stock request details
// router.get('/stock-requests/:requestId', ownerController.getStockRequestById);

// // Approve a stock request
// router.patch('/stock-requests/:requestId/approve', ownerController.approveStockRequest);

// // Reject a stock request
// router.patch('/stock-requests/:requestId/reject', ownerController.rejectStockRequest);

// // Send single request to vendor
// router.post('/stock-requests/:requestId/send-to-vendor', ownerController.sendToVendor);

// // Bulk send approved requests to vendor (NEW)
// router.post('/stock-requests/bulk-send-to-vendor', ownerController.bulkSendToVendor);

// // Mark stock as received
// router.patch('/stock-requests/:requestId/received', ownerController.markStockReceived);


// module.exports = router;

// // // backend/src/routes/ownerRoutes.js
// // const express = require('express');
// // const router = express.Router();
// // const Bill = require('../models/Bill');
// // const Tablet = require('../models/Tablet');
// // const Worker = require('../models/Worker');
// // const authMiddleware = require('../middleware/authMiddleware');

// // const authFile = require('../middleware/authMiddleware.js');

// // const requireOwner = authFile.requireOwner || ((req, res, next) => {
// //   if (req.user?.role !== 'owner') {
// //     return res.status(403).json({ message: 'Access denied: Owner only' });
// //   }
// //   next();
// // });
// // // 📊 GET DASHBOARD STATS
// // router.get('/stats', authMiddleware, requireOwner, async (req, res) => {
// //   try {
// //     const today = new Date();
// //     const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

// //     // Get basic counts
// //     const [totalWorkers, totalMedicines, todaysBills, lowStockItems] = await Promise.all([
// //       Worker.countDocuments({ isActive: true }),
// //       Tablet.countDocuments({ isActive: true }),
// //       Bill.countDocuments({ 
// //         createdAt: { $gte: startOfToday },
// //         status: 'Completed'
// //       }),
// //       Tablet.countDocuments({ 
// //         stock: { $lt: 10 },
// //         isActive: true 
// //       })
// //     ]);

// //     // Get today's sales amount
// //     const todaysSalesResult = await Bill.aggregate([
// //       {
// //         $match: {
// //           createdAt: { $gte: startOfToday },
// //           status: 'Completed'
// //         }
// //       },
// //       {
// //         $group: {
// //           _id: null,
// //           totalSales: { $sum: '$totalAmount' }
// //         }
// //       }
// //     ]);

// //     const todaysSales = todaysSalesResult[0]?.totalSales || 0;

// //     // Get total revenue
// //     const totalRevenueResult = await Bill.aggregate([
// //       {
// //         $match: { status: 'Completed' }
// //       },
// //       {
// //         $group: {
// //           _id: null,
// //           totalRevenue: { $sum: '$totalAmount' }
// //         }
// //       }
// //     ]);

// //     const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

// //     res.json({
// //       success: true,
// //       stats: {
// //         totalWorkers,
// //         totalMedicines,
// //         todaysSales: Math.round(todaysSales),
// //         totalRevenue: Math.round(totalRevenue),
// //         pendingOrders: 0, // Can be implemented later
// //         lowStockItems
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Stats error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch stats'
// //     });
// //   }
// // });

// // // 📈 GET RECENT ACTIVITY
// // router.get('/recent-activity', authMiddleware, requireOwner, async (req, res) => {
// //   try {
// //     const recentBills = await Bill.find({ status: 'Completed' })
// //       .populate('worker', 'name')
// //       .sort({ createdAt: -1 })
// //       .limit(10)
// //       .lean();

// //     const activities = recentBills.map(bill => ({
// //       description: `${bill.worker?.name || 'Worker'} generated bill #${bill.billNumber} - ₹${bill.totalAmount.toFixed(2)}`,
// //       timestamp: new Date(bill.createdAt).toLocaleString('en-IN')
// //     }));

// //     res.json({
// //       success: true,
// //       activities
// //     });

// //   } catch (error) {
// //     console.error('Recent activity error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch recent activity'
// //     });
// //   }
// // });

// // // 🏆 GET TOP MEDICINES
// // router.get('/top-medicines', authMiddleware, requireOwner, async (req, res) => {
// //   try {
// //     const topMedicines = await Bill.aggregate([
// //       { $match: { status: 'Completed' } },
// //       { $unwind: '$items' },
// //       {
// //         $group: {
// //           _id: '$items.tablet',
// //           name: { $first: '$items.name' },
// //           brand: { $first: '$items.brand' },
// //           company: { $first: '$items.brand' },
// //           soldCount: { $sum: '$items.quantity' },
// //           revenue: { $sum: '$items.totalPrice' }
// //         }
// //       },
// //       { $sort: { soldCount: -1 } },
// //       { $limit: 10 }
// //     ]);

// //     const medicines = topMedicines.map(med => ({
// //       name: med.name,
// //       brand: med.brand,
// //       company: med.company,
// //       soldCount: med.soldCount,
// //       revenue: Math.round(med.revenue)
// //     }));

// //     res.json({
// //       success: true,
// //       medicines
// //     });

// //   } catch (error) {
// //     console.error('Top medicines error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch top medicines'
// //     });
// //   }
// // });

// // module.exports = router;
