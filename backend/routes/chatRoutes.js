const express = require('express');
const { chatWithFitBro } = require('../controllers/chatController');

const router = express.Router();

// POST /api/chat — send a message to FitBro
router.post('/', chatWithFitBro);

module.exports = router;
