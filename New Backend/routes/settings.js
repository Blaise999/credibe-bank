const express = require('express');
const router = express.Router();
const { updateSettings } = require('../controllers/settings.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/update', verifyToken, updateSettings);

module.exports = router;
