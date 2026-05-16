// backend/src/routes/tabletRoutes.js - FIXED STOCK CHECKING
const express = require('express');
const router = express.Router();
const Tablet = require('../models/Tablet');
const authMiddleware = require('../middleware/authMiddleware');

// Helper function to calculate total available tablets
const calculateTotalTablets = (tablet) => {
  const pricing = tablet.pricing || {};
  const stock = tablet.stock || {};
  const strip = pricing.strip || {};
  const box = pricing.box || {};
  
  const tabletsPerStrip = strip.tabletsPerStrip || 10;
  const stripsPerBox = box.stripsPerBox || 10;
  const tabletsPerBox = tabletsPerStrip * stripsPerBox;
  
  return (stock.boxes || 0) * tabletsPerBox + 
         (stock.strips || 0) * tabletsPerStrip + 
         (stock.looseTablets || 0);
};

// 🔍 FUZZY SEARCH - Main search endpoint
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q: query, limit = 10, page = 1 } = req.query;
    
    if (!query || query.trim().length < 1) {
      return res.json({
        results: [],
        totalResults: 0,
        page: parseInt(page),
        totalPages: 0
      });
    }

    const searchTerm = query.trim();
    const pageLimit = Math.min(parseInt(limit), 50);
    const skip = (parseInt(page) - 1) * pageLimit;

    // Create fuzzy search query
    const searchQueries = [
      // Exact match (highest priority)
      {
        $or: [
          { name: { $regex: `^${searchTerm}$`, $options: 'i' } },
          { brand: { $regex: `^${searchTerm}$`, $options: 'i' } }
        ],
        isActive: true,
        weight: 100
      },
      // Starts with (high priority)
      {
        $or: [
          { name: { $regex: `^${searchTerm}`, $options: 'i' } },
          { brand: { $regex: `^${searchTerm}`, $options: 'i' } },
          { company: { $regex: `^${searchTerm}`, $options: 'i' } }
        ],
        isActive: true,
        weight: 80
      },
      // Contains (medium priority)
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { brand: { $regex: searchTerm, $options: 'i' } },
          { company: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { searchTerms: { $in: [new RegExp(searchTerm, 'i')] } }
        ],
        isActive: true,
        weight: 60
      }
    ];

    // Execute searches in parallel - INCLUDING ALL PRICING AND STOCK DATA
    const searchPromises = searchQueries.map(async (query) => {
      const { weight, ...searchQuery } = query;
      const results = await Tablet.find(searchQuery)
        .select('name brand company strength pricing stock category description popularity dosageForm isActive packaging')
        .lean();
      
      return results.map(result => {
        // Calculate total available tablets
        const totalTablets = calculateTotalTablets(result);
        
        return {
          ...result,
          totalAvailableTablets: totalTablets,
          inStock: totalTablets > 0,
          searchWeight: weight + (result.popularity || 0) * 0.1
        };
      });
    });

    const allResults = await Promise.all(searchPromises);
    
    // Flatten and deduplicate
    const flatResults = allResults.flat();
    const uniqueResults = new Map();
    
    flatResults.forEach(item => {
      const key = item._id.toString();
      if (!uniqueResults.has(key) || uniqueResults.get(key).searchWeight < item.searchWeight) {
        uniqueResults.set(key, item);
      }
    });

    // Sort and format results
    const sortedResults = Array.from(uniqueResults.values())
      .sort((a, b) => {
        if (b.searchWeight !== a.searchWeight) {
          return b.searchWeight - a.searchWeight;
        }
        return (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(skip, skip + pageLimit)
      .map(({ searchWeight, ...item }) => item);

    const totalResults = uniqueResults.size;
    const totalPages = Math.ceil(totalResults / pageLimit);

    res.json({
      results: sortedResults,
      totalResults,
      page: parseInt(page),
      totalPages,
      query: searchTerm
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Search failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 🚀 AUTOCOMPLETE - Fast suggestions with pricing
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = query.trim();
    
    const suggestions = await Tablet.find({
      $or: [
        { name: { $regex: `^${searchTerm}`, $options: 'i' } },
        { brand: { $regex: `^${searchTerm}`, $options: 'i' } },
        { searchTerms: { $elemMatch: { $regex: `^${searchTerm}`, $options: 'i' } } }
      ],
      isActive: true
    })
    .select('name brand company strength pricing stock category')
    .sort({ popularity: -1 })
    .limit(8)
    .lean();

    // Add totalAvailableTablets to each suggestion
    const suggestionsWithStock = suggestions.map(s => ({
      ...s,
      totalAvailableTablets: calculateTotalTablets(s),
      inStock: calculateTotalTablets(s) > 0
    }));

    res.json({ suggestions: suggestionsWithStock });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ suggestions: [] });
  }
});

// 📈 POPULAR MEDICINES - With full pricing data
router.get('/popular', authMiddleware, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const popularMedicines = await Tablet.find({ isActive: true })
      .select('name brand company strength pricing stock category description popularity dosageForm')
      .sort({ popularity: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add totalAvailableTablets to each medicine
    const medicinesWithStock = popularMedicines.map(m => ({
      ...m,
      totalAvailableTablets: calculateTotalTablets(m),
      inStock: calculateTotalTablets(m) > 0
    }));

    res.json({ medicines: medicinesWithStock });

  } catch (error) {
    console.error('Popular medicines error:', error);
    res.status(500).json({ medicines: [] });
  }
});

// 📊 MEDICINE DETAILS
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Tablet.findById(req.params.id).lean();
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Add calculated fields
    medicine.totalAvailableTablets = calculateTotalTablets(medicine);
    medicine.inStock = medicine.totalAvailableTablets > 0;

    res.json(medicine);

  } catch (error) {
    console.error('Medicine details error:', error);
    res.status(500).json({ message: 'Failed to fetch medicine details' });
  }
});

// 🎯 CATEGORY SEARCH - Search by category
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const pageLimit = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageLimit;

    const medicines = await Tablet.find({
      category: { $regex: category, $options: 'i' },
      isActive: true
    })
    .select('name brand company strength pricing stock category description')
    .sort({ popularity: -1 })
    .skip(skip)
    .limit(pageLimit)
    .lean();

    // Add stock info
    const medicinesWithStock = medicines.map(m => ({
      ...m,
      totalAvailableTablets: calculateTotalTablets(m),
      inStock: calculateTotalTablets(m) > 0
    }));

    const totalCount = await Tablet.countDocuments({
      category: { $regex: category, $options: 'i' },
      isActive: true
    });

    res.json({
      medicines: medicinesWithStock,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / pageLimit)
    });

  } catch (error) {
    console.error('Category search error:', error);
    res.status(500).json({ message: 'Failed to fetch medicines by category' });
  }
});

// 🔄 UPDATE POPULARITY
router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    await Tablet.findByIdAndUpdate(
      req.params.id,
      { $inc: { popularity: 1 } },
      { new: true }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Update popularity error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;