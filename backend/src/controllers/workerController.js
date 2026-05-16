// backend/src/controllers/workerController.js
const StockRequest = require('../models/StockRequest');
const Tablet = require('../models/Tablet');
const Worker = require('../models/Worker');

// ===== STOCK REQUEST CONTROLLERS =====

// Check for duplicate requests (last 2 days)
exports.checkDuplicateRequests = async (req, res) => {
  try {
    const { medicineId } = req.query;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID is required'
      });
    }

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const duplicates = await StockRequest.find({
      tablet: medicineId,
      createdAt: { $gte: twoDaysAgo },
      status: { $in: ['Pending', 'Under Review', 'Approved', 'Ordered'] }
    })
    .populate('requestedBy', 'name employeeId')
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      duplicates,
      duplicateCount: duplicates.length,
      hasDuplicates: duplicates.length > 0
    });

  } catch (error) {
    console.error('Check duplicate requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check duplicate requests'
    });
  }
};

// Get my stock requests
exports.getMyStockRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { requestedBy: req.user.id };

    if (status) {
      query.status = status;
    }

    const requests = await StockRequest.find(query)
      .populate('tablet', 'name brand company strength price category stock')
      .populate('orderDetails.vendor', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalRequests = await StockRequest.countDocuments(query);

    res.json({
      success: true,
      requests,
      totalPages: Math.ceil(totalRequests / limit),
      currentPage: parseInt(page),
      totalRequests
    });

  } catch (error) {
    console.error('Get my stock requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your requests'
    });
  }
};

// Get status of a specific request
exports.getRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await StockRequest.findOne({
      _id: requestId,
      requestedBy: req.user.id
    })
    .populate('tablet', 'name brand company strength price stock')
    .populate('reviewedBy', 'name')
    .populate('orderDetails.vendor', 'name phone email')
    .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or access denied'
      });
    }

    res.json({
      success: true,
      request
    });

  } catch (error) {
    console.error('Get request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request status'
    });
  }
};

// Create a single stock request
exports.createStockRequest = async (req, res) => {
  try {
    const {
      tabletId,
      currentStock,
      requestedQuantity,
      urgencyLevel,
      reason,
      estimatedCost
    } = req.body;

    // Validate required fields
    if (!tabletId || !requestedQuantity || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Tablet ID, quantity, and reason are required'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters'
      });
    }

    // Check if tablet exists
    const tablet = await Tablet.findById(tabletId);
    if (!tablet) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Create stock request
    const stockRequest = new StockRequest({
      tablet: tabletId,
      requestedBy: req.user.id,
      currentStock: currentStock !== undefined ? currentStock : tablet.stock,
      requestedQuantity,
      urgencyLevel: urgencyLevel || 'Medium',
      reason: reason.trim(),
      estimatedCost: estimatedCost || (tablet.price * requestedQuantity),
      isUrgent: urgencyLevel === 'Critical' || tablet.stock === 0
    });

    await stockRequest.save();

    // Populate response
    await stockRequest.populate([
      { path: 'tablet', select: 'name brand company strength price category stock' },
      { path: 'requestedBy', select: 'name employeeId' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Stock request created successfully',
      request: stockRequest
    });

  } catch (error) {
    console.error('Create stock request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock request',
      error: error.message
    });
  }
};

// Create bulk stock requests
exports.createBulkStockRequests = async (req, res) => {
  try {
    const { requests } = req.body;

    console.log('Received bulk request:', { requestsCount: requests?.length });

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Requests array is required and cannot be empty'
      });
    }

    const createdRequests = [];
    const errors = [];

    for (const reqData of requests) {
      try {
        // Validate each request
        if (!reqData.tabletId || !reqData.requestedQuantity || !reqData.reason) {
          errors.push({
            tabletId: reqData.tabletId,
            error: 'Missing required fields: tabletId, requestedQuantity, or reason'
          });
          continue;
        }

        if (reqData.reason.trim().length < 10) {
          errors.push({
            tabletId: reqData.tabletId,
            error: 'Reason must be at least 10 characters'
          });
          continue;
        }

        // Check if tablet exists
        const tablet = await Tablet.findById(reqData.tabletId);
        if (!tablet) {
          errors.push({
            tabletId: reqData.tabletId,
            error: 'Medicine not found'
          });
          continue;
        }

        // Create stock request
        const stockRequest = new StockRequest({
          tablet: reqData.tabletId,
          requestedBy: req.user.id,
          currentStock: reqData.currentStock !== undefined ? reqData.currentStock : tablet.stock,
          requestedQuantity: reqData.requestedQuantity,
          urgencyLevel: reqData.urgencyLevel || 'Medium',
          reason: reqData.reason.trim(),
          estimatedCost: reqData.estimatedCost || (tablet.price * reqData.requestedQuantity),
          isUrgent: reqData.urgencyLevel === 'Critical' || tablet.stock === 0
        });

        await stockRequest.save();
        
        // Populate for response
        await stockRequest.populate([
          { path: 'tablet', select: 'name brand company' },
          { path: 'requestedBy', select: 'name employeeId' }
        ]);

        createdRequests.push(stockRequest);

      } catch (error) {
        console.error(`Error creating request for ${reqData.tabletId}:`, error);
        errors.push({
          tabletId: reqData.tabletId,
          error: error.message
        });
      }
    }

    if (createdRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create any requests',
        errors
      });
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdRequests.length} stock request(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      created: createdRequests.length,
      failed: errors.length,
      requests: createdRequests,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Create bulk stock requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock requests',
      error: error.message
    });
  }
};

// Get duplicate request summary
exports.getDuplicateRequestSummary = async (req, res) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Find all requests from last 2 days
    const recentRequests = await StockRequest.find({
      createdAt: { $gte: twoDaysAgo },
      status: { $in: ['Pending', 'Under Review', 'Approved', 'Ordered'] }
    })
    .populate('tablet', 'name brand')
    .populate('requestedBy', 'name employeeId')
    .lean();

    // Group by tablet to find duplicates
    const medicineMap = new Map();

    recentRequests.forEach(req => {
      const tabletId = req.tablet._id.toString();
      if (!medicineMap.has(tabletId)) {
        medicineMap.set(tabletId, {
          tablet: req.tablet,
          requests: []
        });
      }
      medicineMap.get(tabletId).requests.push(req);
    });

    // Filter medicines with duplicates (more than 1 request)
    const duplicateMedicines = Array.from(medicineMap.values())
      .filter(item => item.requests.length > 1)
      .map(item => ({
        tablet: item.tablet,
        requestCount: item.requests.length,
        requests: item.requests
      }));

    const totalDuplicates = duplicateMedicines.reduce((sum, item) => sum + item.requestCount, 0);

    res.json({
      success: true,
      totalDuplicates,
      duplicateMedicinesCount: duplicateMedicines.length,
      duplicateMedicines
    });

  } catch (error) {
    console.error('Get duplicate summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch duplicate summary'
    });
  }
};

// ===== MEDICINE CONTROLLERS =====

// Get popular medicines
exports.getPopularMedicines = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const medicines = await Tablet.find({ isActive: true })
      .sort({ popularity: -1, stock: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      medicines
    });

  } catch (error) {
    console.error('Get popular medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular medicines'
    });
  }
};

// Search medicines
exports.searchMedicines = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: []
      });
    }

    const searchTerm = q.trim();

    const medicines = await Tablet.find({
      isActive: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
        { company: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
        { searchTerms: { $in: [searchTerm.toLowerCase()] } }
      ]
    })
    .sort({ popularity: -1, stock: 1 })
    .limit(50)
    .lean();

    res.json({
      success: true,
      results: medicines,
      count: medicines.length
    });

  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search medicines'
    });
  }
};

module.exports = exports;