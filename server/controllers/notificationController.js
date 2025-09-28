const Notification = require('../models/Notification');

const formatNotification = (notification) => {
  if (!notification) return null;
  const obj = notification.toObject ? notification.toObject() : { ...notification };
  return {
    _id: obj._id?.toString?.() || obj._id,
    userId: obj.userId?.toString?.() || obj.userId,
    message: obj.message,
    type: obj.type,
    status: obj.status,
    createdAt: obj.createdAt,
  };
};

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications: notifications.map(formatNotification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { message, type = 'system' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ msg: 'Message is required' });
    }

    const allowedTypes = ['order', 'system', 'promotion'];
    const normalizedType = allowedTypes.includes(type) ? type : 'system';

    const notification = await Notification.create({
      userId: req.user.id,
      message: message.trim(),
      type: normalizedType,
    });

    const formatted = formatNotification(notification);
    const io = req.app.get('io');
    if (io && formatted) {
      io.to(req.user.id.toString()).emit('notification:new', formatted);
    }

    res.status(201).json({ notification: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { status: 'read' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json({ notification: formatNotification(notification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
