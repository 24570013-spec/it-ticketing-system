'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { getNotifications, readNotification, readAll } = require('../controllers/notificationController');

const router = Router();

router.get('/',           authenticate, getNotifications);
router.put('/:id/read',   authenticate, readNotification);
router.put('/read-all',   authenticate, readAll);

module.exports = router;
