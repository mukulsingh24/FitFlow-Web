const express = require('express');
const { analyzeFood } = require('../controllers/foodController');

const router = express.Router();

// POST /api/food/analyze — send base64 image for Gemini analysis
router.post('/analyze', analyzeFood);

module.exports = router;
