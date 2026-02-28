const express = require('express');
const router = express.Router();
const { analyzeForm } = require('../controllers/formController');

router.post('/analyze', analyzeForm);

module.exports = router;
