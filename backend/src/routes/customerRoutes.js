// backend/src/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ GET ALL CUSTOMERS (For Owner/Admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'lastPurchaseDate' } = req.query;

    // Only owner can see all customers
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view customers.'
      });
    }

    const query = {};

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'totalSpent') {
      sortOptions.totalSpent = -1;
    } else if (sortBy === 'totalPurchases') {
      sortOptions.totalPurchases = -1;
    } else {
      sortOptions.lastPurchaseDate = -1;
    }

    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalCustomers = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCustomers,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ GET CUSTOMER BY PHONE
router.get('/phone/:phone', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.params;

    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer
    });

  } catch (error) {
    console.error('Get customer by phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer'
    });
  }
});

// ✅ GET CUSTOMER STATISTICS (For Owner/Admin)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Only owner can see stats
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const totalCustomers = await Customer.countDocuments();

    const stats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalSpent' },
          totalPurchases: { $sum: '$totalPurchases' },
          averageSpent: { $avg: '$totalSpent' }
        }
      }
    ]);

    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      stats: {
        totalCustomers,
        ...stats[0],
        topCustomers
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;