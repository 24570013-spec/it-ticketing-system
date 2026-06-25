'use strict';

const { getUserNotifications, markAsRead, markAllAsRead } = require('../services/notificationService');
const { pool } = require('../config/db');

async function getNotifications(req, res, next) {
  try {
    const notifications = await getUserNotifications(req.user.id);
    // Include unread count for frontend badge
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return res.status(200).json({ notifications, unreadCount });
  } catch (err) { next(err); }
}

async function readNotification(req, res, next) {
  try {
    const affected = await markAsRead(req.params.id, req.user.id);
    if (affected === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.status(200).json({ message: 'Marked as read' });
  } catch (err) { next(err); }
}

async function readAll(req, res, next) {
  try {
    await markAllAsRead(req.user.id);
    return res.status(200).json({ message: 'All marked as read' });
  } catch (err) { next(err); }
}

module.exports = { getNotifications, readNotification, readAll };
