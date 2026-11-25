const express = require('express');
const Knowledge = require('../models/Knowledge');

const router = express.Router();

// @route   GET /api/knowledge
// @desc    Get Ayurvedic knowledge entries with optional category & search filter
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { category, dosha, search, featured } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (dosha && dosha !== 'All') {
      query.$or = [{ doshaAffinity: dosha }, { doshaAffinity: 'Tridoshic' }, { doshaAffinity: 'All' }];
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { sanskritName: searchRegex }
      ];
    }

    const items = await Knowledge.find(query).sort({ isFeatured: -1, title: 1 });

    res.json({
      success: true,
      count: items.length,
      knowledge: items
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/knowledge/categories
// @desc    Get all available knowledge categories
// @access  Public
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Knowledge.distinct('category');
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/knowledge/:id
// @desc    Get single knowledge entry by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Knowledge.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge article not found.'
      });
    }

    res.json({
      success: true,
      knowledge: item
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
