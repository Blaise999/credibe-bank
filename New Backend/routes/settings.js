const express = require('express');
const router = express.Router();
const { updateSettings } = require('../controllers/settings.controller');
const verifyToken = require('../middleware/verifyToken');

router.post('/update', verifyToken, updateSettings);

module.exports = router;
