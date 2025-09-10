// routes/settings.js
const express = require('express');
const router = express.Router();

const { updateSettings } = require('../controllers/settings.controller');
const { verifyToken } = require('../middleware/auth');

// Update settings (name, email, phone, avatarUrl, language, timezone)
router.post('/update', verifyToken, updateSettings);

// Optional: allow PUT as well
router.put('/update', verifyToken, updateSettings);

module.exports = router;
