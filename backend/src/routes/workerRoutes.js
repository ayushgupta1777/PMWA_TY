const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const workerController = require('../controllers/workerController');

// All routes require worker authentication
router.use(authMiddleware);

// ===== STOCK REQUEST ROUTES =====

// Check for duplicate requests of a medicine (in last 2 days) (NEW)
router.get('/stock-requests/check-duplicate', workerController.checkDuplicateRequests);

// Get my stock requests
router.get('/stock-requests', workerController.getMyStockRequests);

// Get status of a specific request
router.get('/stock-requests/:requestId', workerController.getRequestStatus);

// Create a single stock request
router.post('/stock-requests', workerController.createStockRequest);

// Create bulk stock requests
router.post('/stock-requests/bulk-create', workerController.createBulkStockRequests);

// Get duplicate request summary (for dashboard)
router.get('/stock-requests/summary/duplicates', workerController.getDuplicateRequestSummary);

// ===== MEDICINE ROUTES =====

// Get popular medicines with low stock
router.get('/medicines/popular', workerController.getPopularMedicines);

// Search medicines
router.get('/medicines/search', workerController.searchMedicines);

module.exports = router;