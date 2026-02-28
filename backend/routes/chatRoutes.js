const express = require('express');
const { chatWithFitBro } = require('../controllers/chatController');

const router = express.Router();

router.post('/', chatWithFitBro);

module.exports = router;
