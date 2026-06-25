'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getStats } = require('../controllers/dashboardController');
const { exportTicketsCSV } = require('../controllers/exportController');

const router = Router();

router.get('/stats',          authenticate, requireRole('admin'), getStats);
router.get('/export/tickets', authenticate, requireRole('admin'), exportTicketsCSV);

module.exports = router;
