const express = require('express');
const { analyzeFood } = require('../controllers/foodController');

const router = express.Router();

router.post('/analyze', analyzeFood);

module.exports = router;
